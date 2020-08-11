const { User } = require('../../../modules/user/models');
const { MainMatch, MainMatchQuiz, ReserveMatch, ReserveMatchDetails } = require('../models');
const { Cache, UserActivity, Constants, Common, FCM, Notification } = require('../../../helpers');

const models = require('../models');
const Op = models.Sequelize.Op;
const db = require('../models/index');

const config = require('../../../config/config.json');

module.exports = {

    //Complexity 12
    async startMatch(sockets) {
        let minuteAgo = new Date();
        minuteAgo.setTime(minuteAgo.getTime() - 60000);
        try {
            let mainMatchInfo = await MainMatch.findOne({
                where: {
                    //...
                },
            });
            if (!mainMatchInfo) return;

            let questions = await MainMatchQuiz.findAll({
                where: {
                    //...
                },
            });
            await Cache.set(Constants.MainMatch.Events.Questions + mainMatchInfo.id, questions, 2400);

            questions = questions.map(question => {
                let optionsWithoutAnswer = question.options.map(opt => {
                    return {
                        id: opt.id,
                        option: opt.option
                    }
                });
                return {
                    id: question.id,
                    text: question.question,
                    image: question.image_name ? (config.hostname + '/images/questions/' + question.image_name) : '',
                    audio: question.audio_file_name ? (config.hostname + '/audio/questions/' + question.audio_file_name) : '',
                    options: Common.shuffle_array(optionsWithoutAnswer)
                }
            });

            let room_id = Constants.MainMatch.Events.Room + mainMatchInfo.id;
            for (let i = 0; i < questions.length; i++) {
                await Cache.set(Constants.MainMatch.Events.CurrentQuestionIndex + mainMatchInfo.id, { index: i }, 2400);
                await module.exports.delay_question(sockets, mainMatchInfo.id, room_id, questions, i);
            }

            module.exports.finishMatch(mainMatchInfo.id);
        }
        catch (error) {
            console.log(error);
        }
    },

    //Complexity 21
    async answer(user, data) {
        if (!(data.main_match_id && data.question_id)) {
            console.log('param error');
            return false;
        }

        let currentQuestionIndex = await Cache.get(Constants.MainMatch.Events.CurrentQuestionIndex + data.main_match_id);
        currentQuestionIndex = currentQuestionIndex.index;

        let isCorrect = 0;
        let score = 0;
        try {

            let questions = await Cache.get(Constants.MainMatch.Events.Questions + data.main_match_id);

            let currentQuestion = questions.filter(q => (q.id === data.question_id))[0];

            if (data.option_id) {
                let userSelectedOption = currentQuestion.options
                    .filter(opt => (opt.id === data.option_id))[0];

                if (userSelectedOption) {
                    isCorrect = userSelectedOption.is_correct;
                    score = UserActivity.calculateScore(data.time, isCorrect, false);
                    if (!isCorrect && currentQuestionIndex >= 10) score -= 5;
                }
            }

            Notification.emitToClient(user.id, Constants.MainMatch.Events.QuestionResult, {
                // ...
            });

            // Read from User specific record
            let currentUserAnswers = await Cache.get(Constants.MainMatch.Events.UserAnswers + user.id);

            let isAnswered = currentUserAnswers
                .filter(a => (a.user_id === user.id && a.question_id === data.question_id))[0];

            if (!isAnswered) {
                currentUserAnswers.push({
                    user_id: user.id,
                    question_id: data.question_id,
                    option_id: data.option_id,
                    is_correct: isCorrect,
                    time: data.time,
                    score: score
                });

                // Write to User specific record
                await Cache.set(Constants.MainMatch.Events.UserAnswers + user.id, currentUserAnswers, 2400);
            }
        }
        catch (err) {
            console.log('main match SetAnswer error:', err);
        }
    },

    //Complexity 6
    async finishMatch(main_match_id) {

        let reservedUsers = await ReserveMatch.findAll({ where: { MainMatchId: main_match_id } });

        Promise.all(
            reservedUsers.map(async ru => {
                let totalScore = 0;
                let totalAnswers = [];

                let userAnswers = await Cache.get(Constants.MainMatch.Events.UserAnswers + ru.UserId)
                if (userAnswers) {
                    userAnswers.forEach(answer => {
                        totalScore += answer.score;
                        totalAnswers.push({
                            ReserveMatchId: ru.id,
                            MainMatchQuizId: answer.question_id,
                            time: answer.time,
                            score: answer.score
                        });
                    });
                    await ReserveMatchDetails.bulkCreate(totalAnswers)
                        .catch(err => {
                            console.log('bulk MainMatch failed', err);
                            console.log('TOTAL Answers:', JSON.stringify(totalAnswers));
                        });

                }
                else {
                    console.log('user answers not found!', ru.UserId)
                }
            })).catch(err => {
                console.log(err);
            });
    },
};