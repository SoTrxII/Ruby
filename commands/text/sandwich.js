const Promise = require('bluebird');

/**
 @param evt L'évènement qui a mené à cette commande.
 @param cmdArg Les arguments de la commande $search
 **/
let sandwich = (evt, command, cmdArg) => {
    return Promise.revolve(evt.reply('http://www.brasil-infos.com/medias/images/sandwich.jpg'));
}

exports.default = {
    sandwich: sandwich
};

exports.help = {
    'sandwich': {desc: "Affiche un très beau sandwich"}
};
