'use strict';

//External Libraries
const Promise = require('bluebird');

//Internal Libraries
const path = require('path');
const Log = require('./logger.js');


//Constants
const baseAppDir = path.join(__dirname, '../');
const MastersIds = ['152795063859150848', '141848794152042496']; // SoTrx, Soulcramer

//Commands
const commandLib = require(path.join(baseAppDir, 'commands'));
const commands = commandLib.commands;
const help = commandLib.help;
console.log(commands);
console.log(help);

/**
 Join a voice channel on the given guild.
 If 'channel' is undefined, search for a channel to join.
 @param guild Guild discord guild to join
 @param channelId Channel's ID to join. Not mandatory
 @return Promise resolve on success, reject otherwise
 (@see Discord.js API)
**/
exports.joinVoiceChannel = (guild, channelId=undefined) => {
  return new Promise ( (resolve, reject) => {
    // If channel is specified / forced
    let channel;
    if(channelId){
      channel = guild.channels.get(channelId);
      if(!channel){
        reject("Specified channel is invalid");
      }
      channel.join().then( (voiceConnection) => {
        resolve(voiceConnection);
        return;
      });
    }else{
      //Fallback, search channel to join
      let voiceChannels = guild.channels.filter( channel => {
        return channel.type === 'voice';
      });

      //First fallback, search for Masters.
      let mastersChannels = voiceChannels.filter( vChannel => {
        for(let MasterId of MastersIds){
          //Search for any of the masters.
          if( vChannel.members.get(MasterId) !== -1){
            return true;
          }
        }
        return false;
      });
      //Join first channel where masters are.
      if(mastersChannels.length !== 0 ){
        channel = mastersChannels.first();
        channel.join().then( (voiceConnection) => {
          resolve(voiceConnection);
          return;
        });
      }else{
        //Second fallback, search for the most populated chan.
        voiceChannels = voiceChannels.sort( (vChan1, vChan2) => {
          let nbVChan1Members = vChan1.members.lenght;
          let nbVChan2Members = vChan1.members.lenght;
          if(nbVChan1Members === nbVChan1Members){
            return 0;
          }else if(nbVChan1Members > nbVChan1Members){
            return 1;
          }else {
            return -1;
          }
        });
        channel = voiceChannels.first();
        channel.join().then( (voiceConnection) => {
          resolve(voiceConnection);
          return;
        })
      }
      }




  });
}

/**
  Execute commands.
  @param message Message Sent message
**/
exports.parseTextCommand = (message) => {
  return new Promise ( (resolve, reject) => {

    let command = message.content.substring(1).split(' ')[0].toLowerCase();
    let parameters = message.content.substring(command.length + 2);
    if(!commands[command]){
      console.log("mah");
    }
    commands[command](message, command, parameters).then(resolve()).catch( (e) => {
      Log.error("A text command has failed to resolve : ", e);
      reject();
    });

  });
}
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
            Log.error("\nUn uncaught Exception occured. Stopping Rin", err);
        } else if (options.cleanup){
            Log.debug("\nLogging out Rin ...");
        }
        global.Rin.destroy().then(Log.debug("Logged out ! Now Halting"));
        process.exit(0);
    }
}
