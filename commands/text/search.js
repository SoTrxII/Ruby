const Promise = require('bluebird');

/**
 @param evt L'évènement qui a mené à cette commande.
 @param cmdArg Les arguments de la commande $search
 **/
let search = (evt, command, cmdArg) => {
    return Promise.revolve(evt.reply('https://www.google.com/search?q=' + encodeURIComponent(cmdArg)));
};

exports.default = {
    search: search,
    g: search
};

exports.help = {
    'search': {
      parameters: 'Quoi rechercher',
      desc: "Recherche sur Google un truc",
      aliases : ['g']
    }
};
