//External Librairies
const Promise = require('bluebird');

/**
 Stop the current File
 **/
let stopPlaying = (evt, command, cmdArg) => {
    return new Promise((resolve, reject) => {
        if (global.voice.dispatcher) {
            global.voice.dispatcher.end("Interrupted");
            resolve();
        } else {
            reject("No dispatcher seems to be initialized");
        }
    });
}

exports.default = {
    yamete: stopPlaying,
    finduflux: stopPlaying,
    'plsstahp;_;' : stopPlaying,
    omgstfu : stopPlaying
}

exports.help = {
    'yamete': {
      parameters: '',
      desc: "Arrête la lecture d'une musique ou d'une vidéo en cours de lecture.",
      aliases : ['finduflux',  'plsstahp;_;', 'omgstfu']
  }
};
