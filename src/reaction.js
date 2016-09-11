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
