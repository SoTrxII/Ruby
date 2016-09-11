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
  console.log(data);
  if(data.indexOf('commande') !== -1 ){
    if(data.indexOf('sandwich') !== -1 ){
      guild.channels.first().sendMessage('http://www.brasil-infos.com/medias/images/sandwich.jpg');
    }else if (data.indexOf('Inception') !== -1  && data.indexOf('YouTube audio') === -1) {
      console.log("Inception");
      console.log(  Ruby.voiceConnections);
      Ruby.voiceConnections.first().playFile("sounds/inception.mp3");
    }
    else if (data.indexOf('YouTube audio') !== -1){


      let searchTerm = data.split(' ').slice(3).join(' ');
      //@TODO Victor thème as a command
      if(searchTerm.indexOf("Victor thème") !== -1){
        searchTerm = "John Cena thème kazoo"
      }
      console.log( 'search : ' + searchTerm);
      youTube.search(searchTerm, 1, function(error, result) {
        if (error) {
          console.log(error);
        }
        else {
          const streamOptions = { seek: 0, volume: 0.3 };
          sceneOuverte.join()
          .then(connection => {
            const stream = ytdl('https://www.youtube.com/watch?v=' +  result.items[0].id.videoId, {filter : 'audioonly', quality : 'lowest'});
            dispatcher = connection.playStream(stream, streamOptions);
          })
          .catch(console.log);
          //console.log(JSON.stringify(result, null, 1));

        }
      });


    }else if (data.indexOf('fin du flux') !== -1){
      dispatcher.end();
    }
  }else{
    guild.channels.first().sendMessage(data);
  }




}
