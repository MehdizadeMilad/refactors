const User = require('../../../modules/user/models').User;
const MainMatch = require('../models').MainMatch;
const MainMatchQuiz = require('../models').MainMatchQuiz;
const ReserveMatch = require('../models').ReserveMatch;
const ReserveMatchDetails = require('../models').ReserveMatchDetails;
const { promisify } = require('util');
const FCM = require('../../../functions/fcm');
const models = require('../models');
const Op = models.Sequelize.Op;
const db = require('../models/index');
const UsableFunctions = require('../../../functions/usable_functions');
const ApiFunctions = require('../../../functions/api_functions');
let hostname = 'http://api.example.com';

const redis = require('../../../functions/redis');


module.exports = {

    //Complexity 9
    async startMatch(sockets) {
        let minuteAgo = new Date();
        minuteAgo.setTime(minuteAgo.getTime() - 60000);
        let mainMatch = await MainMatch.findOne({
            where: {
                // ...
            },
        });

        if (mainMatch) {
            console.log('main match found, id: ' + mainMatch.id);
            let questions = await MainMatchQuiz.findAll({
                where: {
                    //...
                },
                order: models.Sequelize.literal('random()')
            });

            let data = {
                questions,
                user_answers: [],
            };

            client.set('main-match-' + mainMatch.id, JSON.stringify(data), 'EX', 2400);

            let mapped_questions = questions.map(question => {
                let random_opts = question.options.map(opt => {
                    return {
                        id: opt.id,
                        option: opt.option
                    }
                });

                random_opts = UsableFunctions.shuffle_array(random_opts);

                return {
                    id: question.id,
                    text: question.question,
                    image: question.image_name ? hostname + '/images/questions/' + question.image_name : '',
                    audio: question.audio_file_name ? hostname + '/audio/questions/' + question.audio_file_name : '',
                    options: random_opts
                }
            });

            let room_id = 'room_main_match' + mainMatch.id;
            for (let i = 0; i < mapped_questions.length; i++) {
                client.set('current_question_index-' + mainMatch.id, JSON.stringify({ index: i }), 'EX', 2400);
                await module.exports.delay_question(sockets, mainMatch.id, room_id, mapped_questions, i);
            }

            module.exports.finishMatch(mainMatch.id);
        }
    },

    //Complexity 30
    async set_answer(user, data) {
        if (!(data.main_match_id && data.question_id)) {
            return false;
        }
        else {
            const getAsync = promisify(client.get).bind(client);

            let currentQuestion = await getAsync('current_question_index-' + data.main_match_id);
            let currentQuestionIndex = JSON.parse(currentQuestion).index || 1;

            let isCorrect = false;
            let score = 0;
            getAsync('main-match-' + data.main_match_id).then(result => {
                if (result !== null) {
                    let jsonResult = JSON.parse(result);
                    if (jsonResult !== null) {
                        let question = jsonResult.questions.filter(question => {
                            if (question.id === data.question_id) {
                                return question
                            }
                        })[0];

                        if (data.option_id !== 0) {
                            let option = question.options.filter(opt => {
                                if (opt.id === data.option_id) {
                                    return opt;
                                }
                            })[0];

                            if (option) {
                                isCorrect = option.is_correct;
                                score = ApiFunctions.calculateScore(data.time, isCorrect, false);
                            }
                        }

                        if (data.option_id !== 0 && !isCorrect && currentQuestionIndex >= 10) {
                            score -= 5;
                        }

                        UsableFunctions.emitToClient(user.id, 'main_match_question_result', {
                            //...
                        });

                        console.log('main_match_question_result');
                        console.log({
                            question_id: data.question_id,
                            score: score,
                            option: data.option_id,
                            is_correct: !!isCorrect,
                        });

                        let isAnswered = jsonResult.user_answers.filter(answer => {
                            if (answer.user_id === user.id && answer.question_id === data.question_id) {
                                return answer;
                            }
                        })[0];

                        if (!isAnswered) {
                            jsonResult.user_answers.push({
                                user_id: user.id,
                                question_id: data.question_id,
                                option_id: data.option_id,
                                is_correct: isCorrect,
                                time: data.time,
                                score: score
                            });
                            client.set('main-match-' + data.main_match_id, JSON.stringify(jsonResult), 'EX', 2400); // expired in 20 minutes later
                        }
                        else {
                        }

                    }
                    console.log(jsonResult);
                }
                else {
                    return false;
                }
            })
                .catch(e => {
                    return false;
                });
        }
    },

    //Complexity 9
    async finishMatch(main_match_id) {

        let reservedMatch = await ReserveMatch.findAll({
            where: {
                //...
            }
        });

        const getAsync = promisify(client.get).bind(client);
        getAsync('main-match-' + main_match_id).then(result => {
            if (result !== null) {
                let jsonResult = JSON.parse(result);
                if (jsonResult !== null) {
                    Promise.all(reservedMatch.map(async reserve => {
                        let totalScore = 0;
                        jsonResult.user_answers.filter(ans => {
                            if (ans.user_id === reserve.UserId) {
                                return ans;
                            }
                        }).forEach(answer => {
                            totalScore += answer.score;
                            ReserveMatchDetails.create({
                                ReserveMatchId: reserve.id,
                                MainMatchQuizId: answer.question_id,
                                time: answer.time,
                                score: answer.score
                            })
                        });
                    }));
                }
            }
        });
    },
}