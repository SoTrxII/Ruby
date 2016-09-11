'use strict';
console.log("Booting ...");

const serverId = "152843288565514241";
const Discordtoken = "MjIyMzA1MDIzNTM3NzA5MDYw.Cq7dVg.IVj-MAmvx_9PbaYPuJJV3KIeJAo";
let Discord = require("discord.js");
let spawn = require('electron-spawn');
var Speaker = require('speaker');
let guild;
let sceneOuverte;
let receiver;

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

// create an event listener for messages
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

function onSpokenCommand (data){

  if(data.indexOf('commande') !== -1 ){
    if(data.indexOf('sandwich') !== -1 ){
      guild.channels.first().sendMessage('http://www.brasil-infos.com/medias/images/sandwich.jpg');
    }else if (data.indexOf('Inception') !== -1 ) {
      console.log("Inception");
      console.log(  Ruby.voiceConnections);
      Ruby.voiceConnections.first().playFile("sounds/inception.mp3");
    }
  }else{
      guild.channels.first().sendMessage(data);
  }




}

Ruby.login(Discordtoken);
