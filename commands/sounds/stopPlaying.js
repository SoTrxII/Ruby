//External Librairies
const Promise = require('bluebird');

/**
 Stop the current File
**/
let stopPlaying = (evt, command, cmdArg) => {
  return new Promise( (resolve, reject) => {
    if(global.voice.dispatcher){
      global.voice.dispatcher.end("Interrupted");
      resolve();
    }else{
      reject("No dispatcher seems to be initialized");
    }
});
}

exports.default = {
  yamete : stopPlaying,
  finduflux : stopPlaying
}

exports.help = {
  'yamete': {parameters: 'Quoi rechercher', desc : "Let Me Google It For You, Noob"}
};
