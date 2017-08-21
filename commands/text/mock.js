const Promise = require('bluebird');

/**
 @param evt L'évènement qui a mené à cette commande.
 @param cmdArg Les arguments de la commande $say
 **/
let mock = (evt, cmdArg) => {
    return new Promise((resolve, reject) => {
        console.log("meh");
        resolve();
    })
};

exports.default = {
    mock: mock,
};

exports.help = {
    'mock': {desc: 'Debug'}
};
