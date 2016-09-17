'use strict';

//Color.js for logging.
var colors = require('colors/safe')
colors.setTheme({
  normal: ['white', 'italic'],
  input: ['grey'],
  debug: ['blue', 'bold'],
  error: ['red'],
  info: ['green']
});
log("Booting ...", 'info');
var config = require('config');

//Discord Constants
const serverId = config.get('Discord.serverId');
const Discordtoken = config.get('Discord.RubyToken');

let Discord = require("discord.js");
let spawn = require('electron-spawn');

//Used to speak discord PCM stream out loud
var Speaker = require('speaker');

//Youtube parser and streamer used in reactions
const ytdl = require('ytdl-core');
var YouTube = require('youtube-node');
var youTube = new YouTube();
youTube.setKey(config.get('API.Google.youtubeParser'));



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
    callback(data.toString());
  });
}

function log (thingToSay, preset = 'normal'){
  console.log(colors[preset](thingToSay));

}

let Ruby = new Discord.Client();

Ruby.on("ready", () => {
  guild = Ruby.guilds.find("id", serverId);
  let generalChannel = guild.channels.find("id", "152843288565514242");
  log("Ruby is ready !", 'info');
  for (let channel of guild.channels.array()) {
    if (channel.type === "voice" && channel.name.endsWith("Scene Ouverte")) {
      sceneOuverte = channel;
      speechToText(onSpokenCommand);
      channel.join()
      .then(connection => {
        connection.on('speaking', (user, speaking) =>{
          receiver = connection.createReceiver();
          if(speaking){
            //log(user.username +" commence à parler", 'normal')

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
  log(mentioned ? "Ruby has been mentioned" : "Ruby hasn't been mentioned", 'info');
  if (message.content.startsWith("!")) {
    let command = message.content.substring(1).split(" ")[0];
    let parameters = message.content.substring(command.length + 2);
    if(mentioned){
      guild.channels.first().sendMessage('meh');
    }
    onSpokenCommand(message.content);
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
          log("La commande est un vecteur",'debug');
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
        log('No function matching ' + data, 'error');
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
  log( 'search : ' + searchTerm, 'input');
  //Take the first result found on YouTube and stream it.
  youTube.search(searchTerm, 1, function(error, result) {
    if (error) {
      log(error, 'error');
    }
    else {
      const streamOptions = { seek: 0, volume: 0.3 , passes : 3};
      sceneOuverte.join()
      .then(connection => {
        const stream = ytdl('https://www.youtube.com/watch?v=' +  result.items[0].id.videoId, {filter : 'audioonly', quality : 'lowest'});
        dispatcher = connection.playStream(stream, streamOptions);
      })
      .catch(console.log);
    }
  });
}

function onVolumeChange(data){
  let arrayData = data.split(' ')
  let relativeVolume = arrayData[arrayData.indexOf('%') -1] / 100;

  let volume;
  //Fautes volontaires pour que la machine prennent toutes les terminaisons
  if(data.indexOf('mont') !== -1 || data.indexOf('augment') !== -1){
    volume = dispatcher.volume + relativeVolume;
    log('Son monté de ' + relativeVolume + ' pour atteindre ' + volume, 'info');
  }else if(data.indexOf('baisse') !== -1 || data.indexOf('diminue') !== -1){
    volume = dispatcher.volume - relativeVolume;
    log('Son diminué de ' + relativeVolume + ' pour atteindre ' + volume, 'info');
  }else{
    volume = relativeVolume;
    log('Son changé à ' + volume, 'info');
  }
  dispatcher.setVolume(volume);
}

Ruby.login(Discordtoken);
