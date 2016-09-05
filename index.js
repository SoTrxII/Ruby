/*
A ping pong bot, whenever you send "ping", it replies "pong".
*/

const serverId = '152843288565514241'
// import the discord.js module
let Discord = require('discord.js');

let fs = require('fs');

let sceneOuverte = null;

// create an instance of a Discord Client, and call it bot
let bot = new Discord.Client();

// the token of your bot - https://discordapp.com/developers/applications/me
const Discordtoken = 'MjIyMzA1MDIzNTM3NzA5MDYw.Cq7dVg.IVj-MAmvx_9PbaYPuJJV3KIeJAo';

// the ready event is vital, it means that your bot will only start reacting to information
// from Discord _after_ ready is emitted.
bot.on('ready', () => {
  let guild = bot.guilds.find('id',serverId)
  let generalChannel = guild.channels.find('id','152843288565514242')
  console.log('Bot is ready')
  for(let channel of guild.channels.array()) {
		if(channel.type === 'voice' && channel.name.endsWith('Scene Ouverte')) {
      sceneOuverte = channel;
      channel.join()
        .then(connection =>
          console.log('Bot joined voice channel Scene Ouverte'))
        .catch(console.log)
		}
  }

});


// create an event listener for messages
bot.on('message', message => {
  // if the message is "ping",
  // Ignore own messages
	if(message.author.id === bot.user.id)
    return
  let mentioned = message.mentions.users.exists('id',bot.user.id)
  console.log(mentioned?'Rin has been mentioned':'Rin hasn\'t been mentioned');
  if(message.content.startsWith('!')) {
    let command = message.content.substring(1).split(' ')[0]
    let parameters = message.content.substring(command.length + 2)
    if(command === 'inception'){
      sceneOuverte.join().then(connection => {
        console.log('playing inception boom');
           const dispatcher = connection.playFile('sounds/inception.mp3');
           dispatcher.setVolume(0.2)
           return
      });
    }
    if(mentioned)
          return bot.reply(message, 'B-baka!')
  }
});


bot.login(Discordtoken)
