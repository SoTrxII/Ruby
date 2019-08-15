const Promise = require("bluebird");
const MastersIds = global.Config.Discord.MastersIds;


let system = (evt, command, cmdArg) => {
  return new Promise((resolve, reject) => {
    let subCommand = cmdArg.split(' ')[0].toLowerCase();
    let parameters = cmdArg.substring(command.length + 2);
    if (MastersIds.indexOf(evt.author.id) !== -1) {
      resolve();
    }
  });
}

exports.default = {
  system: system,
  sys: system
}