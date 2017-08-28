'use strict';

//External Libraries
const Promise = require('bluebird');
const Discord = require('discord.js');

//Configuration
global.Config = require('./config.json');
const ServerId = Config.Discord.serverId;
global.baseAppDir = __dirname;



//Constants
global.Rin = new Discord.Client();
const Rin = global.Rin; //Convenient alias
const CommandPrefix = '$';
let guild = undefined; //Pre-declared
global.voice = {
    connection: undefined,
    dispatcher: undefined
}; //Pre-declared
const commandTimeout = 8000;

//Internal Libraries
const Log = require("./lib/logger.js");
const Utils = require("./lib/utilities.js");
Log.normal("Booting...");


Rin.on('ready', () => {
    Log.success("Up & Ready to roll");
    guild = Rin.guilds.get(ServerId);

    //Attempt to join a voiceChannel
    Utils.joinVoiceChannel(guild).then((channelConnection) => {
        global.voice.connection = channelConnection;

    }, (err) => {
        Log.error("Could not join any voice channel.", err);
    });


});

Rin.on('message', message => {
    // Bot has to ignore his own message.
    if (message.author.id === Rin.user.id) {
        return;
    }
    Log.userMessage("@" + message.author.username + ": " + message.cleanContent);
    //Message variables.
    let isMentionned = message.isMentioned(Rin.user);
    let isCommand = message.content.startsWith(CommandPrefix);

    //Handle bot command
    if (isCommand) {
        //Commands goes here
        Utils.parseTextCommand(message).then(() => {
            return;
        }).catch(Log.error);

    } else if (isMentionned) {
        Utils.replyRandom(message);
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
process.on('uncaughtException', (err) => {
  Utils.exitHandler({
    panic: true
  }, err);
});
