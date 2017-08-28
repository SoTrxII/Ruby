//External Libraries
const Promise = require('bluebird');
const Path = require("path");
const Ytdl = require('ytdl-core');
const YouTube = require('youtube-node');
const youTube = new YouTube();

//Constants
const baseUrl = 'https://youtube.com/watch?v=';
const specialSearchs = {
    "NyaNya's theme": "J"
};
const streamOptions = {volume: 0.03, passes: 1};

//Internal Librairies
const Log = require(Path.join(global.baseAppDir, 'lib', 'logger.js'));


youTube.setKey("AIzaSyDLxs-tX86li5_i42cWI0-0kTwR8jBF7V4");

/**
 Stop the current File playing.
 **/
let playFromYoutube = (evt, command, cmdArg) => {

    return new Promise((resolve, reject) => {
        if (global.voice.dispatcher) {
            global.voice.dispatcher.end("Interrupted");
        }

        youTube.search(cmdArg, 1, {type: 'video'}, function (error, result) {
            if (error) {
                reject(error);
            } else {
                let stream = Ytdl(baseUrl + result.items[0].id.videoId, {
                    filter: 'audioonly', quality: 'highest'
                });

                global.voice.dispatcher = global.voice.connection.playStream(stream, streamOptions);
                evt.channel.send(baseUrl + result.items[0].id.videoId);

                global.voice.dispatcher.on('end', (reason) => {
                    Log.debug("Fin de lecture de la vidéo Youtube : " + result.items[0].snippet.title);
                    resolve(reason);
                });

                global.voice.dispatcher.on('error', (error) => {
                    //global.voice.dispatcher.destroy();
                    reject(error);
                });

                global.voice.dispatcher.on('debug', (info) => {
                    Log.debug(info);
                });
            }
        });


    });
}

exports.default = {
    yt: playFromYoutube,
    youtube: playFromYoutube,
    musique: playFromYoutube
}

exports.help = {
    'youtube': {
      parameters: 'Truc à rechercher',
      desc: "Cherche et joue une vidéo youtube dans le chat vocal.",
      aliases : ['yt', 'musique']
    }
};
