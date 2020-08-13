module.exports = {
    getQuestions: async (categoryId) => {

        //Takes ~50 ms
        let final_questions = await Promise.all(questions.map(async question => {

            let quizOptions = await QuizOption.findAll({
                where: {
                    QuizId: question.id,
                    is_correct: false,
                },
                limit: 3
            });

            let correctOption = await QuizOption.findOne({
                where: {
                    QuizId: question.id,
                    is_correct: true,
                },
                limit: 1
            });

            quizOptions.push(
                correctOption
            );

            return {
                question: {
                    id: question.id,
                    text: question.question,
                    //...
                },
                options: quizOptions.map(q => { return { id: q.id, option: q.option } }),
                original_options: Common.shuffle_array(quizOptions),
            };
        }));
    }
}