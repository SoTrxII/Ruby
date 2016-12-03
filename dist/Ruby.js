'use strict';

//Color.js for logging.
const chalk = require('chalk');
const log = console.log;
const normal = chalk.italic.white;
const input = chalk.grey;
const debug = chalk.bold.blue;
const error = chalk.red;
const info = chalk.green;

log(info("Booting ..."));
let config = require('../config/default.json');

//Discord Constants
const serverId = config.Discord.serverId;
const Discordtoken = config.Discord.RubyToken;
const mentionedReplic = require("../lib/rubyReplics.json");


let Discord = require("discord.js");
let spawn = require('electron-spawn');

//Used to speak discord PCM stream out loud
// let Speaker = require('speaker');

//Youtube parser and streamer used in reactions
const ytdl = require('ytdl-core');
let YouTube = require('youtube-node');
let youTube = new YouTube();
youTube.setKey(config.API.Google.youtubeParser);


let guild;
let sceneOuverte;
let receiver;
let dispatcher;

/**
 *
 * Test function, starts recognition of spoken language and convert it to text.
 *
 * @param  callback channel Text channel in which the text is to be written
 * @returns None
 * @see Has to be changed. TEST ONLY.
 */
function speechToText(callback) {

    let electron = spawn('src/standalone/speechWorker.js', {
        detached: false
    });
    electron.stderr.on('data', function (data) {
        if (data.toString() === "end42") {
            speechToText(onSpokenCommand);
        }
    });
    electron.stdout.on('data', function (data) {
        callback(data.toString());
    });
}


let Ruby = new Discord.Client();

Ruby.on("ready", () => {
    guild = Ruby.guilds.find("id", serverId);
    let generalChannel = guild.channels.find("id", "152843288565514242");
    log(info("Ruby is ready !"));
    for (let channel of guild.channels.array()) {
        if (channel.type === "voice" && channel.name.endsWith("Scene Ouverte")) {
            sceneOuverte = channel;
            speechToText(onSpokenCommand);
            channel.join()
                .then(connection => {
                    connection.on('speaking', (user, speaking) => {
                        receiver = connection.createReceiver();
                        if (speaking) {
                            log(normal(user.username + " commence à parler"));

                            /*//@NOTE Ne pas effacer cette partie
                             let streamu = receiver.createPCMStream(user);
                             let speaker = new Speaker({
                             channels: 2,          // 2 channels
                             bitDepth: 16,         // 16-bit samples
                             sampleRate: 48000     // 48,000 Hz sample rate
                             });
                             streamu.pipe(speaker);
                             // Fin du NE PAS EFFACER*/


                        }
                    });


                })
                .catch(
                    console.log(error("failed to join channel " + channel.name))
                );
        }
    }

});


Ruby.on("message", message => {
    // Ignore own messages
    if (message.author.id === Ruby.user.id) {
        return;
    }
    let mentioned = message.isMentioned(Ruby.user);

    function mentionRepy() {

    }

    if (mentioned) {
        message.reply(mentionReply(message.author))
            .then(msg => log(info("Ruby has been mentioned by " + message.author.username + " and replied " + msg.content)))
            .catch(console.error);

    } else {
        log(info("Ruby hasn't been mentioned by " + message.author.username));

        if (message.content.startsWith("!")) {
            let command = message.content.substring(1).split(" ")[0];
            log(debug(command));
            let parameters = message.content.substring(command.length + 2);
            if (mentioned) {
                guild.channels.first().sendMessage('meh');
            }
            onSpokenCommand(message.content);
        }
    }
});
let commands = [
    {
        'trigger': 'sandwich',
        'reaction': function (data) {
            guild.channels.first().sendMessage('http://www.brasil-infos.com/medias/images/sandwich.jpg');
        }
    },
    {
        'trigger': ['YouTube audio', 'musique'],
        'reaction': function (data) {
            onYoutubeAudio(data);
        }
    },
    {
        'trigger': 'fin du flux',
        'reaction': function (data) {
            dispatcher.end();
        }
    },
    {
        'trigger': ['volume', 'son'],
        'reaction': function (data) {
            onVolumeChange(data);
        }
    }
];


function mentionReply(author) {
    let replics;
    // for (let user of mentionedReplic) {
    //     if (user.id === author.id) {
    //         replics = user.replic;
    //         break;
    //     }
    // }
    if (replics === undefined) {
        replics = mentionedReplic[mentionedReplic.length - 1].all;
    }
    replics = replics[random(0, replics.length)];
    return replics;
}

function random(startNumber, endNumber) {
    let randomNumber = Math.floor((Math.random() * endNumber) + startNumber);
    return randomNumber;
}

function onSpokenCommand(data) {
    let functionHasBeenTrigered = false;
    if (data.indexOf('commande') !== -1) {
        for (let command of commands) {
            if (Array.isArray(command.trigger)) {
                log(debug("La commande est un vecteur"));
                for (let triggerPart of command.trigger) {
                    if (data.indexOf(triggerPart) !== -1) {
                        command.reaction(data);
                        functionHasBeenTrigered = true;
                        break;
                    }
                }
            } else {
                if (data.indexOf(command.trigger) !== -1) {
                    command.reaction(data);
                    functionHasBeenTrigered = true;
                    break;
                }
            }
        }
        if (!functionHasBeenTrigered) {
            log(error('No function matching ' + data));
        }
    }
}

function onYoutubeAudio(data) {
    //Extract the search query by removing
    let searchTerm = data.split(' ').slice(3).join(' ');

    //Because this is the puprose of the function
    if (searchTerm.indexOf("thème de Victor") !== -1) {
        searchTerm = "John Cena thème kazoo";
    }
    log(input('search : ' + searchTerm));
    //Take the first result found on YouTube and stream it.
    youTube.search(searchTerm, 1, function (error, result) {
        if (error || result.items[0].id === undefined) {
            log(error(error));
        }
        else {
            const streamOptions = {seek: 0, volume: 0.1, passes: 3};
            sceneOuverte.join()
                .then(connection => {
                    const stream = ytdl('https://www.youtube.com/watch?v=' + result.items[0].id.videoId, {
                        filter: 'audioonly',
                        quality: 'lowest'
                    });
                    dispatcher = connection.playStream(stream, streamOptions);
                })
                .catch(console.log);
        }
    });
}

function onVolumeChange(data) {
    let arrayData = data.split(' ');
    let absoluteVolume = arrayData[arrayData.length - 1].substring(0, arrayData.length - 1);
    let relativeVolume = absoluteVolume / 100;

    let volume;
    //Fautes volontaires pour que la machine prennent toutes les terminaisons
    if (data.indexOf('mont') !== -1 || data.indexOf('augment') !== -1) {
        volume = dispatcher.volume + relativeVolume;
        log(info('Son monté de ' + relativeVolume + ' pour atteindre ' + volume));
    } else if (data.indexOf('baisse') !== -1 || data.indexOf('diminue') !== -1) {
        volume = dispatcher.volume - relativeVolume;
        log(info('Son diminué de ' + relativeVolume + ' pour atteindre ' + volume));
    } else {
        volume = relativeVolume;
        log(info('Son changé à ' + volume));
    }

    if (volume > 1.0) {
        volume = 1.0;
    } else if (volume < 0.0) {
        volume = 0.0;
    }

    dispatcher.setVolume(volume);
}

Ruby.login(Discordtoken);
