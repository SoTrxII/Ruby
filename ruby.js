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

let config = require('./config.json');
global.Promise = require('bluebird');

const commandTxt = [
    '**Aide**:',
    '**!search || !g** [recherch google]',
    '**!lmgtfy** [recherche google]',
    '**!inception** (*BOOOM*)',
    '**!say** [message à écrire] (*écrit dans le cannal Scène Ouverte*)',
    '**!youtube || !musique** [recherche youtube] (*joue une vidéo de youtube en audio*)',
    '**!son || !volume** [niveau de volume de **0** à **100**]**%** (*change le volume du son joué*)',
    '**!stop || !fin || !finduflux** (*coupe le son qui était joué*)',
    '**!sandwich** (*voici un délicieux mets*)',
    '**!help || !aide** (*affiche l\'aide*)',
    '',
    '**Prochaine feature**:',
    '- Ajout/suppresion de commande via une commande ex: *!sotrx* => *"poulet"/une image/un gif/une vidéo*'
];

//Discord Constants
const serverId = config.Discord.serverId;
const Discordtoken = config.Discord.RubyToken;
const mentionedReplic = require("./lib/rubyReplics.json");


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
let ruby = new Discord.Client();


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
            // speechToText(onSpokenCommand);
        }
    });
    electron.stdout.on('data', function (data) {
        callback(data.toString());
    });
}


let sendMessage = function (channelName, message) {
    let channel = ruby.channels.find('name', channelName);

    if (channel) {
        channel.sendMessage(message);

    } else {
        log(error('Channel', channelName, 'not found.'));
    }
};

ruby.on("ready", () => {

    log(info('ruby is ready'));
    guild = ruby.guilds.get(serverId);
    guild.channels.array().filter(chan => {
        return chan.type === "voice" && chan.name.endsWith("Scene Ouverte");

    }).map(channel => {
        // speechToText(onSpokenCommand);
        sceneOuverte = channel;
        channel.join()
            .then(connection => {
                // connection.on('speaking', (user, speaking) => {
                //     receiver = connection.createReceiver();
                //     if (speaking) {
                //         log(normal(user.username + " commence à parler"));
                //
                //         /*//@NOTE Ne pas effacer cette partie
                //          let streamu = receiver.createPCMStream(user);
                //          let speaker = new Speaker({
                //          channels: 2,          // 2 channels
                //          bitDepth: 16,         // 16-bit samples
                //          sampleRate: 48000     // 48,000 Hz sample rate
                //          });
                //          streamu.pipe(speaker);
                //          // Fin du NE PAS EFFACER*/
                //
                //
                //     }
                // });


            })
            .catch(error =>
                log(debug("failed to join channel " + channel.name), error(error))
            );
    });

});


ruby.on("message", /*Promise.coroutine(*/function/***/(message) {
    console.log(chalk.yellow(message.author.username), message.cleanContent);

    // Ignore own messages
    if (message.author.id === ruby.user.id) {
        return;
    }

    if (message.content.startsWith('!')) {
        let command = message.content.substring(1).split(' ')[0].toLowerCase();
        let parameters = message.content.substring(command.length + 2);

        // Custom replies
        // let botCommands = yield arn.db.get('Cache', 'botCommands').catch(error => {
        //     return {
        //         replies: {}
        //     };
        // });
        let dispatcher = ruby.voiceConnections.first().player.dispatcher;
        if (dispatcher !== null) {
            dispatcher.end();
        }

        switch (command) {
            case 'say':
                return sendMessage('general', parameters);

            case 'search':
            case 'g':
                return message.reply('https://www.google.com/search?q=' + encodeURIComponent(parameters));

            case 'lmgtfy':
                return message.reply('http://lmgtfy.com/?q=' + encodeURIComponent(parameters));

            case 'youtube':
            case 'yt':
            case 'musique':
                return onYoutubeAudio(parameters);

            case 'son':
            case 'volume':
                return onVolumeChange(parameters);

            case 'stop':
            case 'fin':
            case 'finduflux':
            case 'yamete':
            case 'tg':
                return dispatcher.end();

            case 'sandwich':
                return message.reply('http://www.brasil-infos.com/medias/images/sandwich.jpg');

            case 'inception':
            case 'dramatic':
                return ruby.voiceConnections.get(serverId).playFile(`./sounds/inception.mp3`, {}, (error, streamIntent) => {
                    if (error) {
                        console.error(error);
                    }
                });

            // case 'addreply':
            // case 'ar':
            //     let name = parameters.split(' ')[0];
            //     let reply = parameters.substring(name.length + 1);
            //
            //     if (!name || !reply) {
            //         return;
            //     }
            //
            //     console.log('Adding reply:', name, reply);
            //
            //     // Limit reply length
            //     if (reply.length > 512) {
            //         return;
            //     }
            //
            //     let botCommands = yield arn.db.get('Cache', 'botCommands').catch(error => {
            //         return {
            //             replies: {}
            //         };
            //     });
            //
            //     botCommands.replies[name] = reply;
            //
            //     return arn.db.set('Cache', 'botCommands', botCommands)
            //         .then(() => message.reply('Registered commands:\n' + Object.keys(botCommands.replies)));
            // case 'removereply':
            // case 'rr':
            //     let name = parameters;
            //
            //     if (!name) {
            //         return;
            //     }
            //     let botCommands = yield arn.db.get('Cache', 'botCommands').catch(error => {
            //         return {
            //             replies: {}
            //         };
            //     });
            //
            //     delete botCommands.replies[name];
            //
            //     return arn.db.set('Cache', 'botCommands', botCommands).then(() => message.reply('Registered commands:\n' + Object.keys(botCommands.replies).join(', ')));
            //
            // case 'replies':
            //     let botCommands = yield arn.db.get('Cache', 'botCommands').catch(error => {
            //         return {
            //             replies: {}
            //         };
            //     });
            //
            //     return message.reply('Registered commands:\n' + Object.keys(botCommands.replies).join(', '));

            case 'help':
            case 'aide':
                let help = '\n' + commandTxt.join('\n');
                return message.reply(help);

            // case rubyCommands.replies[command]:
            //     return message.reply(botCommands.replies[command]);

            default :
                return message.reply("Mais, euh, tu ne m'avais pas dit de t'écouter. Donc, bah je l'ai pas fait.");

        }
    }

    let mentioned = message.isMentioned(ruby.user);

    if (mentioned) {
        return message.reply(mentionReply(message.author))
            .then(msg => log(info("ruby has been mentioned by " + message.author.username + " and replied " + msg.content)))
            .catch(console.error);
    }

    // if (mentioned) {
    //
    //
    // } else {
    //     log(info("ruby hasn't been mentioned by " + message.author.username));
    //
    //     if (message.content.startsWith("!")) {
    //         let command = message.content.substring(1).split(" ")[0];
    //         log(debug(command));
    //         let parameters = message.content.substring(command.length + 2);
    //         if (mentioned) {
    //             guild.channels.first().sendMessage('meh');
    //         }
    //         onSpokenCommand(message.content);
    //     }

    // }
})/*)*/;
// let commands = [
//     {
//         'trigger': 'sandwich',
//         'reaction': function (data) {
//             guild.channels.first().sendMessage('http://www.brasil-infos.com/medias/images/sandwich.jpg');
//         }
//     },
//     {
//         'trigger': ['YouTube audio', 'musique'],
//         'reaction': function (data) {
//             onYoutubeAudio(data);
//         }
//     },
//     {
//         'trigger': 'fin du flux',
//         'reaction': function (data) {
//             dispatcher.end();
//         }
//     },
//     {
//         'trigger': ['volume', 'son'],
//         'reaction': function (data) {
//             onVolumeChange(data);
//         }
//     }
// ];


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

// function onSpokenCommand(data) {
//     let functionHasBeenTrigered = false;
//     if (data.indexOf('commande') !== -1) {
//         for (let command of commands) {
//             if (Array.isArray(command.trigger)) {
//                 log(debug("La commande est un vecteur"));
//                 for (let triggerPart of command.trigger) {
//                     if (data.indexOf(triggerPart) !== -1) {
//                         command.reaction(data);
//                         functionHasBeenTrigered = true;
//                         break;
//                     }
//                 }
//             } else {
//                 if (data.indexOf(command.trigger) !== -1) {
//                     command.reaction(data);
//                     functionHasBeenTrigered = true;
//                     break;
//                 }
//             }
//         }
//         if (!functionHasBeenTrigered) {
//             log(error('No function matching ' + data));
//         }
//     }
// }

function onYoutubeAudio(search) {

    //Because this is the puprose of the function
    if (search.indexOf("thème de Victor") !== -1) {
        search = "John Cena thème kazoo";
    }
    log(input('search : ' + search));
    //Take the first result found on YouTube and stream it.
    youTube.search(search, 1, function (error, result) {
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
                .catch(log);
        }
    });
}

function onVolumeChange(data) {
    let absoluteVolume = data.substring(0, data.length - 1);
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

ruby.login(Discordtoken);
