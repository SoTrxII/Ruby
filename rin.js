'use strict';

//External Libraries
const Promise = require('bluebird');
const Discord = require('discord.js');

//Internal Libraries
const MentionedReplic = require("./lib/rubyReplics.json");
const Log = require("./lib/logger.js");
const Utils = require("./lib/utilities.js");

Log.normal("Booting...");

//Configuration
const Config = require('./config.json');
const ServerId = Config.Discord.serverId;


//Constants
global.Rin = new Discord.Client();
const Rin = global.Rin; //Convenient alias
const commandPrefix = '$';
var guild = undefined; //Pre-declared
global.voice = {
  connection : undefined,
  dispatcher : undefined
}; //Pre-declared
const commandTimeout = 8000;



Rin.on('ready', () => {
  Log.success("Up & Ready to roll");
  guild = Rin.guilds.get(ServerId);

  //Attempt to join a voiceChannel
  Utils.joinVoiceChannel(guild).then( (channelConnection) => {
    global.voice.connection = channelConnection;

  }, (err) => {
    Log.error("Could not join any voice channel.", err);
  });


});

Rin.on('message', message => {
  // Bot has to ignore his own message.
  if(message.author.id === Rin.user.id){
    return;
  }
  Log.userMessage("@" + message.author.username + ": " + message.cleanContent);

  //Handle bot command
  if (message.content.startsWith('$')) {
    //Commands goes here
    Utils.parseTextCommand(message).then(() => {
      return;
    }).catch(Log.error);
  }

});

Rin.login(Config.Discord.RubyToken).then(Log.success("Successfully logged in"));

/**
  PROCESS EVENTS
**/

//do something when app is closing
process.on('exit', Utils.exitHandler.bind(null, {
    cleanup: true
}));
//catches ctrl+c event
process.on('SIGINT', Utils.exitHandler.bind(null, {
    cleanup: true
}));
//catches uncaught exceptions
process.on('uncaughtException', Utils.exitHandler.bind(null, {
    panic: true
}));
