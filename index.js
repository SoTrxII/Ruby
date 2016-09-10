'use strict';

console.log("Booting ...");
const serverId = "152843288565514241";

let Discord = require("discord.js");
let spawn = require('electron-spawn');
var Speaker = require('speaker');
let guild;
let sceneOuverte;
let receiver;

let Ruby = new Discord.Client();

/**
*
 * Test function, starts recognition of spoken language and convert it to text.
 *
 * @param  Channel channel Text channel in which the text is to be written
 * @returns None
 * @see Has to be changed. TEST ONLY.
 */
function speechToText(channel){

  var electron = spawn('./speech.js', {
    detached: false
  });
  electron.stderr.on('data', function (data) {
  if(data.toString() === "end42"){
    speechToText();
  }
  });
  electron.stdout.on('data', function (data) {
    guild.channels.first().sendMessage(data.toString());
  });
}

// the token of your Ruby - https://discordapp.com/developers/applications/me
const Discordtoken = "MjIyMzA1MDIzNTM3NzA5MDYw.Cq7dVg.IVj-MAmvx_9PbaYPuJJV3KIeJAo";

// the ready event is vital, it means that your Ruby will only start reacting to information
// from Discord _after_ ready is emitted.
Ruby.on("ready", () => {
  guild = Ruby.guilds.find("id", serverId);
  let generalChannel = guild.channels.find("id", "152843288565514242");
  console.log("Ruby is ready");
  for (let channel of guild.channels.array()) {
    if (channel.type === "voice" && channel.name.endsWith("Scene Ouverte")) {
      sceneOuverte = channel;
      speechToText(channel);
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

Ruby.login(Discordtoken);
