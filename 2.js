const User = require('../../../modules/user/models').User;
const { promisify } = require('util');

module.exports = {

    //Complexity 29
    async lastMatchDetails(req, res) {

        //...

        // Get Opponent User info from cache
        let userId = req.user.id; // Validation done.
        let opponent = null;

        const getAsync = promisify(client.get).bind(client);
        await getAsync('game-' + match.token).then(result => {
            if (result !== null) {
                let json_result = JSON.parse(result);
                if (json_result !== null) {
                    opponent = json_result.player1 === userId ? json_result.player2_info : json_result.player1_info;
                }
            }
        });

        if (!opponent) {
            opponent = await User.findByPk(opponentUserId, {
                //...
            });
        }

        // does this user get's The Winner extra score?
        let win_score = match.Player1Id === userId ? (match.player1_score > match.player2_score ? 40 : 0) : (match.player2_score > match.player1_score ? 40 : 0);

        // correctAnswers = Count of correct answers in all user's answer
        // timeAnswer = Sum of all seconds user used to answer each question
        let correctAnswers = 0;
        let timeAnswer = 0;
        if (match.Player1Id === userId) {
            correctAnswers = match.MatchQuizzes.filter(quiz => {
                return quiz.player1_score > 0;
            }).length;

            timeAnswer = match.MatchQuizzes.reduce(function (cnt, o) { return cnt + o.player1_time; }, 0);
        }
        else {
            correctAnswers = match.MatchQuizzes.filter(quiz => {
                return quiz.player2_score > 0;
            }).length;
            timeAnswer = match.MatchQuizzes.reduce(function (cnt, o) { return cnt + o.player2_time; }, 0);
        }

        // ...
    },

    //Complexity 5
    // a Question has 4 options
    // 3 are Wrong
    // 1 is Correct
    // we need to select 2 random wrong options
    async use_50_50(user, gameToken, questionId) {

        // ... 

        questions.forEach(item => {
            if (item.question.id === parseInt(questionId)) {
                while (incorrect_options.length < 2) {
                    let rnd = parseInt(Math.random() * item.options.length);
                    if (!item.options[rnd].is_correct) {
                        incorrect_options.push(item.options[rnd].id);
                        item.options.splice(rnd, 1);
                    }
                }
            }
        });

        //...
    },
};