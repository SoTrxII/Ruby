//External Librairies
const Promise = require('bluebird');

const minVolume = 0;
const maxVolume = 1;

/**
 Stop the current File playing.
**/
let controlVolume = (evt, command, cmdArg) => {

  return new Promise( (resolve, reject) => {
    //Take only the first arg if multiple are given
    let volume = cmdArg.split(' ')[0];

    if( !isValidFloat(volume) || volume < minVolume || volume > maxVolume){
      reject("Invalid volume value entered. Rejecting changes");
    }else{
      if(!global.voice.dispatcher){
        reject("No dispatcher is running. Rejecting changes");
      }else{
        global.voice.dispatcher.setVolume(volume);
        resolve();
      }
    }


  });
}

exports.default = {
  son : controlVolume,
  volume : controlVolume
}

exports.help = {
  'volume': {parameters: 'Valeur entre '+minVolume+' et ' +maxVolume, desc : "Change le son de la musique jouée"}
};

let isValidFloat = (n) => {
  return Number(n) == n
}
