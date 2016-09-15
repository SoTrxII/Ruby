Ruby.on("message", message => {
  // if the message is "ping",
  // Ignore own messages
  if (message.author.id === Ruby.user.id) {
    return;
  }
  let mentioned = message.mentions.users.exists("id", Ruby.user.id);
  log(mentioned ? "Rin has been mentioned" : "Rin hasn't been mentioned");
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
      const streamOptions = { seek: 0, volume: 0.4 };
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
