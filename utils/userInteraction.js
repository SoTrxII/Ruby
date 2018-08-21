/**
 * @async
 * @public
 * @summary Wait
 for a user to post a valid message
 * @param {String} authorId who are we waiting for ?
 * @param {Function} validation is the given message valid ? Returns True or False
 * @param {Integer} timeout Reject automatically after a certain time (-1 for infinite)
 * @returns {Promise<String>} Resolve with the message the user sent.
 */
function waitForMessage (authorId, validation, timeout) {
    return new Promise((resolve, reject) => {
        if(timeout != -1){
            setTimeout( () => {
                reject("Timeout")
            }, timeout)
        }
        let func = (message) => {
            if (message.author.id == authorId) {
                if (validation(message.content, message)) {
                    global.Rin.off('message', func);
                    resolve(message);
                }
            }
        };
        global.Rin.on('message', func);
     });
}

/**
 * @async
 * @public
 * @summary Ask a user a yes / no question
 * @param {Discordjs/Message} evt General handle to text channel
 * @param {Discordjs/User_id} authorId Id of the one user that has to answer 
 * @param {String} question question to ask
 * @param {Integer} timeout timeout for the question. (Default is 5') Null is then returned.
 * @returns {Promise<Boolean>} true for yes, false for no, null if timeout
 */
async function yesNoQuestion(evt, authorId, question, timeout){
    evt.reply(`${question} [O/n]`)
    let message = await waitForMessage(authorId, (message) => {
        const validResponses = ['O', 'o', 'n', 'N', 'Oui', 'Non', 'oui', 'non'];
        if(validResponses.includes(message)){
            return true;
        }else {
            evt.reply("C'est oui ou non...");
            return false
    }

    },timeout || 5*60*1000).catch(ex => {return null});
    let positiveAnswers = ['O', 'o', 'Oui', 'oui'];
    return positiveAnswers.includes(message.content)

}
/**
 * @summary Make the user choose between the choices in itemList
 * @param {Discordjs/Message} evt General handle to text channel
 * @param {Object[]} itemList Choices. Each choice has to have a .toString() method
 * @param {String} question Question to ask the user
 * @param {Object} [options] optional parameters
 * @param {String} options.noItemResponse what to repy itemList is empty (nothing if undefined)
 * @param {Integer} options.timeout timeout for the question. (Default is 5') Null is then returned.
 * @param {Boolean} [options.displayChoices=true] Whether to display the choices 
 * @returns {Promise<Object>} chosen item or null if no item, stopped or timeout
 */
async function chooseOneItem(evt, itemList, question, options){
    if (itemList.length == 0) {
        if(options.noItemResponse){
            evt.reply(options.noItemResponse)
        }
        return null;
    }
    else if (itemList.length == 1) {
        chosenItem = itemList[0];
        return chosenItem
    } else {

        choicestring = `${question} (staph pour annuler) \n`

        if (options.displayChoices){
            for (let [index, campaign] of itemList.entries()) {
                choicestring += `\t\t**${index + 1}**)\t-->\t`
                choicestring += await campaign.toString()
            }
        }

        evt.channel.send(choicestring)
        let choice = await waitForMessage(evt.author.id, (message) => {
            if (message == "staph") {
                return true;
            }
            let choice = parseInt(message);
            if (choice > itemList.length || choice < 1) {
                evt.reply(`Je te dis entre 1 et ${itemList.length} et tu me réponds ${choice}...`)
                return false;
            } else if (isNaN(choice) || !isFinite(choice)) {
                evt.reply(`Numbers, do you speak it ? Try again !`)
                return false;
            } else {
                return true;
            }

        }, options.timeout || 5 * 60 * 100).catch(ex => {return null});

        if (choice.content == 'staph') {
            evt.channel.send("Annulé !")
            return null;
        }
        chosenItem = itemList[(parseInt(choice.content) - 1)];

        return chosenItem
    }
}


module.exports = {
    waitForMessage : waitForMessage,
    chooseOneItem: chooseOneItem,
    yesNoQuestion: yesNoQuestion
}
