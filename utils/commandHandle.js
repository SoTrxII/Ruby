/**
 * Handles commands processing. Can display help, invoke commands function or reject commands
 * @module parseTextCommand
 */
const path = require('path')
const {
    commands,
    help
} = require(path.join(global.baseAppDir, 'commands'));
console.log(help)

/**
 Execute commands.
 @param message Message Sent message
 @return {Promise<void>} Resolve if a command was executed
 **/
exports.parseTextCommand = (message) => {
        return new Promise((resolve, reject) => {
            let command = message.content.substring(1).split(' ')[0].toLowerCase();
            let parameters = message.content.substring(command.length + 2);

                    //Redirect to special command help
                    if (command === 'help' || command == 'halp') {
                        let returnString = '';
                        for (let command of Object.keys(help).sort()) {
                            returnString += `\n **\`$${command}\`** ${(help[command].parameters) ? '_\`' + (help[command].parameters) + '\`_' : ''}\n\t\
                _${help[command].desc}_\
                ${ help[command].aliases ? "\n\t__Alias__ : " + help[command].aliases.join(', ') : ''}`;
            }
            message.channel.send(returnString);
            resolve();
            return;
        }

        //Check if command exists
        if (!commands[command]) {
            console.error(`
                            Command $ {
                                command
                            }
                            does no exists(GG $ {
                                message.author.username
                            })
                            `);
            reject();
            return;
        }

        //Execute commands.
        commands[command](message, command, parameters).then(() => {
            //If the command was a $sys something command and succeded, then grant access to admin commands
            if (command === 'sys' || command === 'system') {
                let subCommand = parameters.split(' ')[0].toLowerCase();
                let subParameters = parameters.substring(subCommand.length + 1);
                //Execute sys commands.
                sysCommands[subCommand](message, subCommand, subParameters).then(resolve()).catch((e) => {
                    console.error("Failed to execute system command : ", e);
                    reject();
                })
            }
        }).catch((e) => {
            console.error("A text command has failed to resolve : ", e.stack);
            reject();
        });

    });
};