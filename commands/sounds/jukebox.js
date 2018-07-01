//External Libraries
const Promise = require('bluebird');
const {
  join
} = require("path");
const Jukebox = require(join(global.baseAppDir, 'classes', 'Jukebox.js'));

/**
 * @async
 * @public
 * Add a music to play 
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Music to add
 */
const addToQueue = async (evt, command, cmdArg) => {
  await _updateJukebox(evt);

  if (!global.jukebox.addMusic(cmdArg, evt.author)) {
    evt.channel.send(`${cmdArg} n'est pas un lien valide, non ajouté à la liste de lecture`);
    return;
  }
  await evt.channel.send(`Chansons à venir :`);
  global.jukebox.displayQueue();

}

/**
 * @async
 * @public
 * Starts the jukebox
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const play = async (evt, command, cmdArg) => {
  await _updateJukebox(evt);

  if (global.jukebox.isPlaying) {
    evt.channel.send(`La lecture est déjà en cours !`);
    return;
  }

  if (!global.jukebox.play()) {
    evt.channel.send(`Il n'y a pas de chanson dans la liste de lecture !`)
    return;
  }


}

/**
 * @async
 * @public
 * Starts the jukebox
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const stop = async (evt, command, cmdArg) => {
  await _updateJukebox(evt);

  if (!global.jukebox.isPlaying) {
    evt.channel.send(`Il n'y a pas de musique en cours de lecture !`);
    return;
  }

  if (!global.jukebox.stop()) {
    evt.channel.send(`JE NE PEUX PAS ARRETER WAAA !!!1`)
    return;
  }


}

/**
 * @async
 * @public
 * Pauses the jukebox
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const pause = async (evt, command, cmdArg) => {
  await _updateJukebox(evt);

  if (!global.jukebox.isPlaying) {
    evt.channel.send("C'est difficile de faire pause sans avoir commencé à jouer...");
    return;
  }

  global.jukebox.pause();
}

/**
 * @async
 * @public
 * Resume the jukebox
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const resume = async (evt, command, cmdArg) => {
  await _updateJukebox(evt);

  if (!global.jukebox.isPaused()) {
    evt.channel.send("C'est difficile de reprendre sans faire pause...");
    return;
  }

  global.jukebox.resume();
}

/**
 * @async
 * @public
 * Displays playlist
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const list = async (evt, command, cmdArg) => {
  await _updateJukebox(evt);

  global.jukebox.displayQueue();

}

/**
 * Skip current song and starts next
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {Integer} [cmdArg = 0] If specified, skip cmdArg song
 */
const skip = async (evt, command, cmdArg) => {
  await _updateJukebox(evt);
  if (!parseInt(cmdArg)) {
    cmdArg = 0;
  }

  try {
    global.jukebox.skipTo(cmdArg);
  } catch (ex) {
    console.log(ex)
    evt.channel.send(`Impossible de passer ${cmdArg} chansons`);
  }


}
/**
 * @async
 * @public
 * Change playback volume
 * @param {Discord/Message} evt Change the volume of the playback
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {Integer} cmdArg New volume
 */
const setVolume = async (evt, command, cmdArg) => {
  await _updateJukebox(evt);

  if (!global.jukebox.setVolume(cmdArg)) {
    evt.channel.send("Volume invalide. Il doit être compris entre 0 et 100")
    return;
  }
}


/**
 * @async
 * @private
 * Assert jukebox existence and update the textChannel it's writing into
 * and the voicechannel it's streaming into
 * @param {Discord/Message} evt message event leading to this function
 */
const _updateJukebox = async (evt) => {

  const asker = evt.guild.members.get(evt.author.id);
  const voiceChannel = asker.voiceChannel;

  if (!voiceChannel) {
    evt.reply("Tu dois être dans un canal vocal pour pouvoir lancer une commande !")
    return;
  }
  //Join user voicechannel
  if (!global.voiceConnection || global.voiceConnection.id != voiceChannel.id) {
    global.voiceConnection = await voiceChannel.join()
  }

  if (!global.jukebox) {
    global.jukebox = new Jukebox(global.voiceConnection, evt.channel);
  }

  if (global.jukebox.textChannel.id != evt.channel.id) {
    global.jukebox.setTextChannel(evt.channel)
  }

}


exports.default = {
  play: play,
  musique: play,
  addMusic: addToQueue,
  am: addToQueue,
  ajouter: addToQueue,
  list: list,
  liste: list,
  pause: pause,
  resume: resume,
  reprendre: resume,
  volume: setVolume,
  skip: skip,
  passer: skip,
  son: setVolume,
  stop: stop

}

exports.help = {
  'ajouter': {
    parameters: "URL d'une vidéo Youtube",
    desc: "Ajoute une musique à la liste de lecture",
    aliases: "am"
  },
  'liste': {
    parameters: "",
    desc: "Affiche la liste de lecture",
    aliases: "list"
  },
  'play': {
    parameters: "",
    desc: "Balance la musique de la liste de lecture",
    aliases: "musique"
  },
  'pause': {
    parameters: "",
    desc: "Met en pause la lecture de la musique en cours"
  },
  'reprendre': {
    parameters: "",
    desc: "Reprends la lecture après une pause",
    aliases: "resume"
  },
  'passer': {
    parameters: "",
    desc: "Arrête la chanson en cours et passe à la suivante",
    aliases: "skip"
  },
  'son': {
    parameters: "Entier entre 0 et 100",
    desc: "Change le volume de la lecture",
    aliases: "volume"
  },
  'stop': {
    parameters: "",
    desc: "Arrête la lecture",
    aliases: "volume"
  },
};