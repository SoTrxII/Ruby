'use strict';

//External Libraries
const Promise = require('bluebird');
const Discord = require('discord.js');

//Internal Libraries
const path = require('path');
const writeFile = Promise.promisify(require("fs").writeFile);
const Log = require('./logger.js');
const MentionedReplics = require("./rubyReplics.json");

//Constants
const MastersIds = global.Config.Discord.MastersIds // SoTrx, Soulcramer

//Commands
const commandLib = require(path.join(global.baseAppDir, 'commands'));
const commands = commandLib.commands;
const help = commandLib.help;

const sysCommands = require(path.join(global.baseAppDir, 'systemCommands')).commands;
console.log(sysCommands)
/**
 Join a voice channel on the given guild.
 If 'channel' is undefined, search for a channel to join.
 @param guild Guild discord guild to join
 @param channelId Channel's ID to join. Not mandatory
 @return Promise resolve on success, reject otherwise
 (@see Discord.js API)
 **/
exports.joinVoiceChannel = (guild, channelId = undefined) => {
    return new Promise((resolve, reject) => {
        // If channel is specified / forced
        let channel;
        if (channelId) {
            channel = guild.channels.get(channelId);
            if (!channel) {
                reject("Specified channel is invalid");
            }
            channel.join().then((voiceConnection) => {
                resolve(voiceConnection);
            });
        } else {
            //Fallback, search channel to join
            let voiceChannels = guild.channels.filter(channel => {
                return channel.type === 'voice';
            });

            //First fallback, search for Masters.
            let mastersChannels = voiceChannels.filter(vChannel => {
                for (let MasterId of MastersIds) {
                    //Search for any of the masters.
                    if (vChannel.members.get(MasterId) !== -1) {
                        return true;
                    }
                }
                return false;
            });
            //Join first channel where masters are.
            if (mastersChannels.length !== 0) {
                channel = mastersChannels.first();
                channel.join().then((voiceConnection) => {
                    resolve(voiceConnection);
                });
            } else {
                //Second fallback, search for the most populated chan.
                voiceChannels = voiceChannels.sort((vChan1, vChan2) => {
                    let nbVChan1Members = vChan1.members.lenght;
                    let nbVChan2Members = vChan2.members.lenght;
                    if (nbVChan1Members === nbVChan2Members) {
                        return 0;
                    } else if (nbVChan1Members > nbVChan2Members) {
                        return 1;
                    } else {
                        return -1;
                    }
                });
                channel = voiceChannels.first();
                channel.join().then((voiceConnection) => {
                    resolve(voiceConnection);
                })
            }
        }


    });
};

/**
 Execute commands.
 @param message Message Sent message
 **/
exports.parseTextCommand =  (message) => {
    return new Promise((resolve, reject) => {

        let command = message.content.substring(1).split(' ')[0].toLowerCase();
        let parameters = message.content.substring(command.length + 2);

        //Reject private commands if needed.
        if(!global.Config.Commands.allowPrivate && message.channel.type !== "text"){
          Log.error(`${message.author.username} tried a private command ( ${message.content} ) but it is forbidden`);
          message.reply("Tu veux me parler en privé ? ... °-° ... *souffle dans son siflet anti-viol*\n http://img.memecdn.com/no-lolicon-allowed_o_5196649.jpg");
          reject();
          return;
        }
        //Redirect to special command help
        if(command === 'help'){
          displayHelp(message).then(resolve());
          return;
        }
        //Check if command exists
        if (!commands[command]) {
            Log.error(`Command ${command} does no exists (GG ${message.author.username})`);
            reject();
            return;
        }

        //Check in the list if the author is denied from executing the command.
        let denyList = global.Config.Commands.denyList;
        if(denyList[command] && denyList[command].indexOf(message.author.id) !== -1 ){
          Log.error(`${message.author.username} attempted to use '${command}', but he is forbidden from it.`);
          message.reply('http://scontent.cdninstagram.com/t51.2885-15/s480x480/e35/12328447_758582167576277_589464694_n.jpg');
          reject();
          return;
        }

        //Execute commands.
        commands[command](message, command, parameters).then( () => {
          //If the command was a $sys something command and succeded, then grant access to admin commands
          if(command === 'sys' || command === 'system'){
            let subCommand = parameters.split(' ')[0].toLowerCase();
            let subParameters = parameters.substring(subCommand.length + 1);
            //Execute sys commands.
            sysCommands[subCommand](message, subCommand, subParameters).then(resolve()).catch((e) => {
              Log.error("Failed to execute system command : ", e);
              reject();
            })
          }
        }).catch((e) => {
            Log.error("A text command has failed to resolve : ", e.stack);
            reject();
        });

    });
};

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

//Subscope to emulate a static variable
{
    let isExiting = false;
    /**
     * Special handler call upon Rin's death. (I Cri Evrytiem)
     * @param  {[Object]} options variables to handle special case while switching off
     * @param  {[Exception]} err Exception that caused Rin's death
     * @return {[void]}
     */
    exports.exitHandler = (options, err) => {
        if (isExiting) {
            return;
        }
        isExiting = true;
        if (options.panic) {
            Log.error("\nUn uncaught Exception occured. Stopping Rin", err.stack);
            console.trace();
        } else if (options.cleanup) {
            Log.debug("\nLogging out Rin ...");
        }
        global.Rin.destroy().then(Log.debug("Logged out ! Now Halting"));
        process.exit(0);
    }
}

/**
Create an Rich embed with default data.
It's main purpose is to proxy the creation and prevent commands from importing Discord.js
@param data Object Override parameters.
@return RichEmbed
**/
exports.createEmbed = (data) => {

  let templateEmbed = new Discord.RichEmbed({
    color: 3447003,
      author: {
        name: global.Rin.user.username,
        icon_url: global.Rin.user.avatarURL
      },
      title: "This is an embed",
      url: "http://google.com",
      description: "This is a test embed to showcase what they look like and what they can do.",
      fields: [{
          name: "Fields",
          value: "They can have different fields with small headlines."
        },
        {
          name: "Masked links",
          value: "You can put [masked links](http://google.com) inside of rich embeds."
        },
        {
          name: "Markdown",
          value: "You can put all the *usual* **__Markdown__** inside of them."
        }
      ],
      timestamp: new Date(),
      footer: {
        icon_url: global.Rin.user.avatarURL,
        text: "In Pocot We Trust, In Chicken we love"
      }
  });

  Object.assign(templateEmbed, data);
  return templateEmbed;
}

exports.saveConfig = () => {
  return new Promise( (resolve, reject) => {
    writeFile('config.json', JSON.stringify(global.Config, null, 2), 'utf8').then( () => {
      resolve();
    });
  })
}


/********
 Internal functions
 *********/

/**
 Return a pseudo-random Integer between min and max
 @param min Integer minimum integer to generate
 @param max Integer maximum integer to generate
 **/
let randInt = (min = 0, max) => {
    return Math.floor((Math.random() * max) + min);
}
/**
  Display command help as a reply of an event.
  @param evt Incoming message event
  @return Promise of execution.
**/
let displayHelp = (evt) => {
  return new Promise((resolve, reject) => {
    let returnString = '';
    for(let command of Object.keys(help).sort() ){
      returnString += `**${command}** : _${help[command].desc}_\n\t\
      __Usage__ : ${command} _${(help[command].parameters) ? '[' + (help[command].parameters) + ']' : ' '}_\n\t\
      ${ help[command].aliases ? "__Alias__ : " +  help[command].aliases.join(', ') + "\n" : ' '}\n `;
    }
    evt.channel.send(returnString);
    resolve();
  });
}
