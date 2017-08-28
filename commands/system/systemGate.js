const Promise = require("bluebird");
const MastersIds = global.Config.Discord.MastersIds;

const channelGun = require('./channelGun.js').default.gomugomuchannelgun;

let system = (evt, command, cmdArg) => {
  return new Promise( (resolve, reject) => {
    let subCommand = cmdArg.split(' ')[0].toLowerCase();
    let parameters = cmdArg.substring(command.length + 2);
    if(MastersIds.indexOf(evt.author.id) !== -1){
        resolve();
    }else{
      evt.reply("Cette partie est... privée... C'est l'heure de la punition !").then( () => {
        channelGun(evt, command, evt.author.id);
        reject(evt.author.username + " a essayé de lancer une commande système ("+ command + cmdArg +").");
      });

    }

  });
}

exports.default = {
    system: system,
    sys: system
}
