const Promise = require('bluebird');

/**
@param evt L'évènement qui a mené à cette commande.
@param cmdArg Les arguments de la commande $search
**/
let lmgtfy = (evt, command, cmdArg) => {
  return Promise.revolve(evt.reply('http://lmgtfy.com/?q=' + encodeURIComponent(cmdArg)));
}

exports.default = {
  lmgtfy : lmgtfy
};

exports.help = {
  'lmgtfy': {parameters: 'Quoi rechercher', desc : "Let Me Google It For You, Noob"}
};
