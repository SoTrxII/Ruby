//External Libraries
const Promise = require('bluebird');
let writeFile = Promise.promisify(require("fs").writeFile);
const path = require('path');

//Constant
const commands = require(path.join(baseAppDir, 'commands')).commands;

let lock = (evt, command, cmdArg) => {
    return new Promise((resolve, reject) => {
      let subCommand = cmdArg.split(' ')[0].toLowerCase();
      let subParameters = cmdArg.substring(subCommand.length + 1);
      let namesOrIds = subParameters.split(' ');

      if(subCommand === "private"){
        global.Config.Commands.allowPrivate = ( command !== 'lock' );
      }
      //If the command does not exists
      else if(Object.keys(commands).indexOf(subCommand) !== -1){
        let denyList = global.Config.Commands.denyList;

        for(let nameOrId of namesOrIds){
          let member  = getMember(evt.guild.members, nameOrId);
          // Si l'id ou le nom donné ne correspond à rien.
          if(!member){
            evt.reply(`${nameOrId} n'est pas un identifiant valide, admin`).then( () => {
              reject("Member does not exists");
            })
          }else{
            if(command === 'lock'){
              //Prevent a User from using a command
              if( !denyList || Object.keys(denyList).indexOf(subCommand) === -1){
                denyList[subCommand] = [];
              }else if (denyList[subCommand].indexOf(member.firstKey()) === -1){
                denyList[subCommand].push(member.firstKey());
              }
            }else if (command === 'unlock'){
              //"Unban" user.
              let indexOfMember = denyList[subCommand].indexOf(member.firstKey());
              if (indexOfMember !== -1){
                denyList[subCommand].splice(indexOfMember, 1);
              }
            }


          }
        }

      }else{
        evt.reply(`"${subCommand}" n'est pas une commande valide, admin.`).then( () => {
          reject("Command " + subcommand + " does not exist.");
          return;
        });
      }
      //Save the config file.
      writeFile('config.json', JSON.stringify(global.Config, null, 2), 'utf8').then( () => {
        resolve();
      });


    });
}
/**
  Get member from an identifiable trait (id, username)
  @param members Array of all members
  @param trait to identify
  @return Member if found, false if not.
**/
let getMember = (members, ident) => {
  let chosenOne = members.filter( (member) => {
    return member.user.username == ident || member.user.id == ident;
  });
  return chosenOne;
}

exports.default = {
    lock: lock,
    unlock : lock
}
