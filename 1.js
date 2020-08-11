const ReserveMatch = require('../models').ReserveMatch;
const ReserveMatchDetails = require('../models').ReserveMatchDetails;
const { promisify } = require('util');

module.exports = {

    //Complexity 9
    async startMatch() {
        // ...

        let questions = []; // Get Questins from DB

        let cacheDataStructure = {
            questions,
            user_answers: [],
        };

        client.set('main-match-' + mainMatch.id, JSON.stringify(cacheDataStructure), 'EX', 2400);

        // remove is_correct indicator from Options 
        // to send it to user

        // ...
    },

    //Complexity 30
    async set_answer(dataFromClient) {
        // ...

        // Read from shared record in cache
        const getAsync = promisify(client.get).bind(client);
        getAsync('main-match-' + dataFromClient.main_match_id).then(result => {
            let gameDataInCache = JSON.parse(result);
            if (gameDataInCache !== null) {

                // current User Answers In Cache
                gameDataInCache.user_answers.push({
                    // ...
                });
                client.set('main-match-' + dataFromClient.main_match_id, JSON.stringify(gameDataInCache), 'EX', 2400); // expired in 20 minutes later
            }

        });
    },

    //Complexity 9
    async finishMatch(main_match_id) {

        // All players
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

                        jsonResult.user_answers.filter(ans => {
                            if (ans.user_id === reserve.UserId) {
                                return ans;
                            }
                        })
                            .forEach(() => {
                                ReserveMatchDetails.create({
                                    // ... Model properties
                                })
                            });
                    }));
                }
            }
        });
    },
}