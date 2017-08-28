const Promise = require("bluebird");
const Utils = require("../../lib/utilities.js");

let channelGun = (evt, command, cmdArg) => {
  return new Promise( (resolve, reject) => {
    let voiceChannels = evt.guild.channels.filter( (channel) => {
      return channel.type == 'voice';
    });
    ///console.log(voiceChannels);
    let members = evt.guild.members.filter( (member) => {
      return member.user.username == cmdArg || member.user.id == cmdArg;
    });
    if(members){
      for(let member of members){
        changeChannel(voiceChannels, member);
      }
    }else{
      evt.reply("Je ne connais pas de " + cmdArg);
    }


  });
}

exports.default = {
    gomugomuchannelgun: channelGun,
}

let changeChannel = (voiceChannels, member) => {
  let i=0;
  member[1].setVoiceChannel(voiceChannels.random()).then( () => {
    if(++i !== 10){
      changeChannel(voiceChannels, member)
    }
  }).catch(console.error);
}

exports.help = {
    'gomugomuchannelgun': {parameters : "Utilisateur", desc: 'Victmisation active.'}
};
