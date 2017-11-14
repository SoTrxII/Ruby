const Path = require('path');
const Utils = require(Path.join(baseAppDir, 'lib', 'utilities.js'));
/**
 Set the true Audio scale limit for the application.
**/
let audio = (evt, command, cmdArg) => {
    return new Promise((resolve, reject) => {
      if(cmdArg && Number(cmdArg) == cmdArg){
        global.Config.Audio.scaleLimit = cmdArg;
        Utils.saveConfig().then( () => {
          evt.reply("Limite correctement changée, admin");
          resolve();
        });
      }else{
        evt.reply("Nouvelle limite invalide");
        reject("new AudioLimit invalid, aboring");
      }

    })
}

exports.default = {
    audio: audio
}
