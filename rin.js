'use strict';

//External Libraries
const Discord = require('discord.js');

//Configuration
global.Config = require('./config.json');
global.baseAppDir = __dirname;



//Constants
global.Rin = new Discord.Client();
const Rin = global.Rin; //Convenient alias
const CommandPrefix = '$';

//Internal Libraries
const Log = require("./utils/logger.js");
const {
    parseTextCommand
} = require('./utils/commandHandle.js');
const {
    replyRandom
} = require('./utils/replyAtRandom.js');
const {
    exitHandler
} = require('./utils/exitHandler');


Log.normal("Booting...");


Rin.on('ready', () => {
    Log.success("Up & Ready to roll");
});

Rin.on('message', message => {
    // Bot has to ignore his own message.
    if (message.author.id === Rin.user.id) {
        return;
    }
    Log.userMessage("@" + message.author.username + ": " + message.cleanContent);
    //Message variables.
    let isMentioned = message.isMentioned(Rin.user);
    let isCommand = message.content.startsWith(CommandPrefix);

    //Handle bot command
    if (isCommand) {
        console.log("command")
        //Commands goes here
        parseTextCommand(message).catch(Log.error);

    } else if (isMentioned) {
        replyRandom(message);
    }

});


Rin.login(Config.Discord.RubyToken).then(Log.success("Successfully logged in"));

/**
 PROCESS EVENTS
 **/


//do something when app is closing
process.on('exit', exitHandler.bind(null, {
    cleanup: true
}));
//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {
    cleanup: true
}));
//catches uncaught exceptions
process.on('uncaughtException', (err) => {
    exitHandler({
        panic: true
    }, err);
});