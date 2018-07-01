const Promise = require('bluebird');

/**
 @param evt L'évènement qui a mené à cette commande.
 @param cmdArg Les arguments de la commande $search
 **/
let sandwich = (evt, command, cmdArg) => {
    return Promise.revolve(evt.reply('http://www.club-sandwich.net/images/photorecettes/parisien.jpg'));
};

exports.default = {
    sandwich: sandwich
};

exports.help = {
    'sandwich': {
        desc: "Affiche un très beau sandwich"
    }
};