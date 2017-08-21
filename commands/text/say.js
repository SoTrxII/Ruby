const Promise = require('bluebird');

/**
 @param evt L'évènement qui a mené à cette commande.
 @param cmdArg Les arguments de la commande $say
 **/
let writeOnChat = (evt, command, cmdArg) => {
    return Promise.revolve(evt.reply(cmdArg));
}

exports.default = {
    say: writeOnChat,
    tell: writeOnChat
};

exports.help = {
    'say': {parameters: 'Quoi dire', desc: "Fait répéter à Ruby la phrase entrée"}
};
