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
