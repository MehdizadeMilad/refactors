const { User } = require('../../user/models');
const { Cache } = require('../../../helpers');

module.exports = {

    //Complexity 18
    async lastMatchDetails(req, res) {

        // ...

        // Get Opponent User info from cache
        let userId = req.user.id; // Validation done.
        let thisPlayerNo = null;
        let opponentPlayerNo = null;

        if (userId === match.Player1Id) {
            thisPlayerNo = 'player1';
            opponentPlayerNo = 'player2';
        }
        else {
            thisPlayerNo = 'player2';
            opponentPlayerNo = 'player1';
        }

        let opponent = null;
        let gameData = await Cache.get('game-' + match.token);
        if (gameData) {
            opponent = gameData[`${opponentPlayerNo}_info`]
        }
        else {
            opponent = await User.findByPk(opponentUserId, {
                //...
            });
        }

        // does this user get's The Winner extra score?
        winScore = (match[`${thisPlayerNo}_score`] > match[`${opponentPlayerNo}_score`] ? 40 : 0);

        // correctAnswers = Count of correct answers in all user's answer
        // timeAnswer = Sum of all seconds user used to answer each question
        let correctAnswers = 0;
        let timeAnswer = 0;
        correctAnswers = match.MatchQuizzes.filter(m => m[`${thisPlayerNo}_score`]).length;
        timeAnswer = match.MatchQuizzes.reduce((total, currentItem) => total + currentItem[`${thisPlayerNo}_time`], 0);

        // ...
    },

    //Complexity 3
    async use_50_50(user, gameToken, questionId) {

        // ...

        let currentQuestionOptions = (questions.filter(q => q.question.id === questionId)[0]).options.filter(o => !o.is_correct)
        let wrongOptions = [];
        wrongOptions.push(currentQuestionOptions.splice(Math.floor(Math.random() * 3), 1)[0].id);
        wrongOptions.push(currentQuestionOptions.splice(Math.floor(Math.random() * 2), 1)[0].id);

        // ...
    },
};