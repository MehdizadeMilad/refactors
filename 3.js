module.exports = {
    getQuestions: async (categoryId) => {

        //Takes ~20 ms

        let questionsIds = questions.map(q => q.id);

        let allQuestionOptions = await QuizOption.findAll({
            where: {
                QuizId: {
                    [Op.in]: questionsIds
                }
            }
        });

        return questions.map(question => {

            let allOptions = allQuestionOptions.filter(opt => opt.QuizId === question.id);

            let correctOption = allOptions.filter(opt => opt.is_correct);

            let incorrectOptions = allOptions.filter(opt => !opt.is_correct);

            // 3 incorrect options + 1 correct option
            let options = Common.shuffle_array(incorrectOptions).splice(0, 3).concat(Common.shuffle_array(correctOption).splice(0, 1));

            return {
                question: {
                    id: question.id,
                    text: question.question,
                    // ...
                },
                options: options.map(q => { return { id: q.id, option: q.option } }),
                original_options: Common.shuffle_array(options),
            }
        });
    }
}