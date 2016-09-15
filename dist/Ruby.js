'use strict';
console.log("Booting ...");

const serverId = "152843288565514241";
const Discordtoken = "MjIyMzA1MDIzNTM3NzA5MDYw.Cq7dVg.IVj-MAmvx_9PbaYPuJJV3KIeJAo";
let Discord = require("discord.js");
let spawn = require('electron-spawn');
var Speaker = require('speaker');
const ytdl = require('ytdl-core');
var YouTube = require('youtube-node');
var youTube = new YouTube();
youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU');
let guild;
let sceneOuverte;
let receiver;
let dispatcher;

/**
*
 * Test function, starts recognition of spoken language and convert it to text.
 *
 * @param  Channel channel Text channel in which the text is to be written
 * @returns None
 * @see Has to be changed. TEST ONLY.
 */
function speechToText(callback){

  var electron = spawn('src/standalone/speechWorker.js', {
    detached: false
  });
  electron.stderr.on('data', function (data) {
  if(data.toString() === "end42"){
    speechToText(onSpokenCommand);
  }
  });
  electron.stdout.on('data', function (data) {
    console.log("calling callback");
    callback(data.toString());
  });
}

let Ruby = new Discord.Client();

Ruby.on("ready", () => {
  guild = Ruby.guilds.find("id", serverId);
  let generalChannel = guild.channels.find("id", "152843288565514242");
  console.log("Ruby is ready");
  for (let channel of guild.channels.array()) {
    if (channel.type === "voice" && channel.name.endsWith("Scene Ouverte")) {
      sceneOuverte = channel;
      speechToText(onSpokenCommand);
      channel.join()
      .then(connection => {
        connection.on('speaking', (user, speaking) =>{
          receiver = connection.createReceiver();
          if(speaking){
            console.log(user.username +" commence à parler");

            //@NOTE Ne pas effacer cette partie
            /*let streamu = receiver.createPCMStream(user);
            var speaker = new Speaker({
              channels: 2,          // 2 channels
              bitDepth: 16,         // 16-bit samples
              sampleRate: 48000     // 48,000 Hz sample rate
            });
            streamu.pipe(speaker);*/
            // Fin du NE PAS EFFACER


          }
        });


      })
      .catch(console.log());
    }
  }

});

Ruby.on("message", message => {
  // if the message is "ping",
  // Ignore own messages
  if (message.author.id === Ruby.user.id) {
    return;
  }
  let mentioned = message.mentions.users.exists("id", Ruby.user.id);
  console.log(mentioned ? "Rin has been mentioned" : "Rin hasn't been mentioned");
  if (message.content.startsWith("!")) {
    let command = message.content.substring(1).split(" ")[0];
    let parameters = message.content.substring(command.length + 2);
    if (command === "inception") {
      console.log("Inception");
      sceneOuverte.join().then(connection => {
        connection.playFile("sounds/inception.mp3");
      });
      return;
    }
    if (mentioned) {
      return message.reply("B-baka!");
    }
  }
});
let commands = [
  {
    'trigger' : 'sandwich',
    'reaction' :  function(data){
      guild.channels.first().sendMessage('http://www.brasil-infos.com/medias/images/sandwich.jpg');
    }
  },
  {
    'trigger' : ['YouTube audio', 'musique'],
    'reaction' :  function(data){
      onYoutubeAudio(data);
    }
  },
  {
    'trigger' : 'fin du flux',
    'reaction' :  function(data){
      dispatcher.end();
    }
  },
  {
    'trigger' : ['volume','son'],
    'reaction' :  function(data){
      onVolumeChange(data);
    }
  }
];
function onSpokenCommand (data){
  let functionHasBeenTrigered = false;
    if(data.indexOf('commande') !== -1 ){
      for(let command of commands){
        if(Array.isArray(command.trigger)){
          console.log("La commande est un vecteur");
          for(let triggerPart of command.trigger){
            if(data.indexOf(triggerPart) !== -1){
              command.reaction(data);
              functionHasBeenTrigered = true;
              break;
            }
          }
        }else{
          if(data.indexOf(command.trigger) !== -1){
            command.reaction(data);
            functionHasBeenTrigered = true;
            break;
          }
        }

      }
      if(!functionHasBeenTrigered){
        console.log('No function matching ' + data);
      }
    }
}

function onYoutubeAudio(data){
  //Extract the search query by removing
  let searchTerm = data.split(' ').slice(3).join(' ');

  //Because this is the puprose of the function
  if(searchTerm.indexOf("thème de Victor") !== -1){
    searchTerm = "John Cena thème kazoo"
  }
  console.log( 'search : ' + searchTerm);
  //Take the first result found on YouTube and stream it.
  youTube.search(searchTerm, 1, function(error, result) {
    if (error) {
      console.log(error);
    }
    else {
      const streamOptions = { seek: 0, volume: 0.4 };
      sceneOuverte.join()
      .then(connection => {
        const stream = ytdl('https://www.youtube.com/watch?v=' +  result.items[0].id.videoId, {filter : 'audioonly', quality : 'lowest'});
        dispatcher = connection.playStream(stream, streamOptions);
      })
      .catch(console.log);
      //console.log(JSON.stringify(result, null, 1));

    }
  });
}

function onVolumeChange(data){
  console.log(data);
  let arrayData = data.split(' ')
  let relativeVolume = arrayData[arrayData.indexOf('%') -1] / 100;
  console.log(relativeVolume);


  let volume;
  //Fautes volontaires pour que la machine prennent toutes les terminaisons
  if(data.indexOf('mont') !== -1 || data.indexOf('augment') !== -1){
    volume = dispatcher.volume + relativeVolume;
    console.log('son monté de ' + relativeVolume + ' pour atteindre ' + volume);
  }else if(data.indexOf('baisse') !== -1 || data.indexOf('diminue') !== -1){
    volume = dispatcher.volume - relativeVolume;
    console.log('son diminué de ' + relativeVolume + ' pour atteindre ' + volume);
  }else{
    volume = relativeVolume;
    console.log('son changé à ' + volume);
  }
  dispatcher.setVolume(volume);
}

Ruby.login(Discordtoken);
