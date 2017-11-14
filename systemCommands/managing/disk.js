const Path = require('path');
const Utilities = require(Path.join(global.baseAppDir, 'lib','utilities.js'));

let showDiskUsage = (evt, cmdArg) => {
    return new Promise( async (resolve, reject) => {
      let res = await Utilities.checkDiskSpace();
      evt.reply(`Utilisation du disque :\n\
      \tTotal  : ${res.total}\n\t\
      Used : ${res.used}\n\t\
      Free : ${res.free}
      `);
    });
}

exports.default = {
    disk: showDiskUsage,
}
