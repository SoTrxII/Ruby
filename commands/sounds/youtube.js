//External Libraries
const Promise = require('bluebird');
const Path = require("path");
const Ytdl = require('ytdl-core');
const YouTube = require('youtube-node');
const youTube = new YouTube();

const Utilities = require(Path.join(global.baseAppDir, 'lib','utilities.js'));

//Constants
const baseUrl = 'https://youtube.com/watch?v=';
const specialSearchs = {
    "NyaNya's theme": "J"
};
const streamOptions = {seek: 0, volume: 1};

//Internal Librairies
const Log = require(Path.join(global.baseAppDir, 'lib', 'logger.js'));


youTube.setKey("AIzaSyDLxs-tX86li5_i42cWI0-0kTwR8jBF7V4");

/**
 Stop the current File playing.
 **/
let playFromYoutube = (evt, command, cmdArg) => {

    return new Promise((resolve, reject) => {
      if (global.voice.dispatcher) {
            global.voice.dispatcher.destroy();

        }

        //Regex matching Youtube URL. Args are :
        // match  1 : https://
        // match 2 : www.
        // match 3 : youtube.com // youtu.be
        // match 4 : videoId
        let regYtUrl = RegExp('^(https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*v=(.[^&]+).*$');
        let matches = cmdArg.match(regYtUrl);
        if(matches){
          //Wait a second to ensure the stream destruction
          Utilities.waitFor(500).then(() => {
            playStream(evt, matches[4]).then(resolve());
          });
        }else{
          youTube.search(cmdArg, 1, {type: 'video'}, function (error, result) {
              if (error) {
                  reject(error);
              } else {
                  if(!result.items){
                    evt.reply("Aucun résultat pour cette recherche");
                    return;
                  }else{
                    console.log(result);
                    playStream(evt, result.items[0].id.videoId, result.items[0].snippet.title).then(resolve());
                  }

              }
          });
        }

    });
};


function playStream(evt, videoId, title){
  return new Promise((resolve, reject) => {
    console.log(baseUrl + videoId);
    let stream = Ytdl(baseUrl + videoId, {
        filter: 'audioonly'
    });

    evt.channel.send(baseUrl + videoId);
    global.voice.dispatcher = global.voice.connection.playStream(stream, streamOptions);

    global.voice.dispatcher.on('end', (reason) => {
      Log.debug("Fin de lecture de la vidéo Youtube : " + (title || "non nommée") );

      resolve(reason)
      console.log("resolved")


    });

    global.voice.dispatcher.on('error', (error) => {
        //global.voice.dispatcher.destroy();
        Log.error(error);
        reject(error);
    });

    global.voice.dispatcher.on('debug', (info) => {
        Log.debug(info);
    });
  });


}

exports.default = {
    yt: playFromYoutube
}

exports.help = {
    'yt': {
      parameters: 'Texte ou URL',
      desc: "Cherche et joue une vidéo youtube dans le chat vocal."
    }
  };
