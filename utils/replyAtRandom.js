const {
    join
} = require('path')
const MentionedReplics = require(join(global.baseAppDir, 'rubyReplics.json'))
/**
 Answer a message on a random basis.
 @param message Message Sent message
 **/
exports.replyRandom = (message) => {
    return new Promise((resolve, reject) => {
        //Get user specifics responses
        let authorCustomResponses = MentionedReplics.filter((usersReplics) => {
            // noinspection EqualityComparisonWithCoercionJS
            return usersReplics.id == message.author.id;
        })[0].replics;
        //Get all users general reponses.
        let generalResponses = MentionedReplics[MentionedReplics.length - 1].all;
        let finalReplics = (authorCustomResponses) ? authorCustomResponses : generalResponses;
        message.reply(finalReplics[randInt(0, authorCustomResponses.length)]).then(resolve()).catch(reject());

    })
};