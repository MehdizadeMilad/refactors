const { ReserveMatch, ReserveMatchDetails } = require('../models');
const { Cache, Constants, Common } = require('../../../helpers');

module.exports = {

    //Complexity 12
    async startMatch() {


        let questions = [] // Get Questins from DB

        let cacheDataStructure = {
            questions
        }

        await Cache.set(Constants.MainMatch.Events.Questions + mainMatchInfo.id, cacheDataStructure, 2400);

        // remove is_correct indicator from Options (inline) 
        // to send it to user
        questions = questions.map(question => {
            let optionsWithoutAnswer = question.options.map(opt => {
                return {
                    id: opt.id,
                    option: opt.option
                }
            });
            return {
                //...
                options: Common.shuffle_array(optionsWithoutAnswer)
            }
        });

        // ...
    },

    //Complexity 21
    async answer(clientInfo) {

        // ...

        // Read from User specific record
        let currentUserAnswersInCache = await Cache.get(Constants.MainMatch.Events.UserAnswers + clientInfo.id);

        currentUserAnswersInCache.push({
            //... put user answer to his/her specific cache record
        });

        // Write back to cache
        await Cache.set(Constants.MainMatch.Events.UserAnswers + clientInfo.id, currentUserAnswersInCache, 2400);

        // ...
    },

    //Complexity 6
    async finishMatch(main_match_id) {

        // All players
        let reservedUsers = await ReserveMatch.findAll({ where: { MainMatchId: main_match_id } });

        Promise.all(
            reservedUsers.map(async ru => {

                // Get each user's answer from separate cache records
                let totalAnswers = [];

                let userAnswers = await Cache.get(Constants.MainMatch.Events.UserAnswers + ru.UserId)
                userAnswers.forEach(() => {
                    totalAnswers.push({
                        // ... Model properties
                    });
                });

                // Bulk create
                await ReserveMatchDetails.bulkCreate(totalAnswers);

            }));
    },
};