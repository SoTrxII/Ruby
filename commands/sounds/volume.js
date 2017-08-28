//External Librairies
const Promise = require('bluebird');

const minVolume = 1;
const maxVolume = 100;
//True limit audio scaling.
const maxScaleLimit = global.Config.Audio.scaleLimit;

/**
 Stop the current File playing.
 **/
let controlVolume = (evt, command, cmdArg) => {

    return new Promise((resolve, reject) => {
        //Take only the first arg if multiple are given
        let volume = cmdArg.replace('%', '').split(' ')[0];

        if (!isValidFloat(volume) || volume < minVolume || volume > maxVolume) {
            evt.reply(`Le volume doit être compris entre ${minVolume} et ${maxVolume}`);
            reject("Invalid volume value entered. Rejecting changes");
        } else {
            if (!global.voice.dispatcher) {
                reject("No dispatcher is running. Rejecting changes");
            } else {
                //Volume on a scale on 1 to maxScaleLimit %.
                // Ex : User entered 100 % with a scaleLimit of 40 %  => 100/100/2.5 = 2/5 = 40%
                console.log((volume * maxScaleLimit) / (maxVolume *100));
                global.voice.dispatcher.setVolume( (volume * maxScaleLimit) / (maxVolume *100) );
                resolve();
            }
        }


    });
};

exports.default = {
    son: controlVolume,
    volume: controlVolume
};

exports.help = {
    'volume': {
      parameters: 'Valeur entre ' + minVolume + ' et ' + maxVolume,
      desc: "Change le son de la musique jouée",
      aliases : ['son']
    }
};

let isValidFloat = (n) => {
    // noinspection EqualityComparisonWithCoercionJS
    return Number(n) == n
};
