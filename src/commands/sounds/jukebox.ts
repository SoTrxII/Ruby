import { GlobalExt } from "../../@types/global";
import { Jukebox } from "../../components/Jukebox/jukebox";
import { Message, TextChannel } from "discord.js";
import { getValids } from "../../utils/command-handle";
import Timeout = NodeJS.Timeout;

declare const global: GlobalExt;
const TIMEOUT_TIME = 5 * 60 * 1000;
let timeout: Timeout;
/**
 * @async
 * @private
 * @summary Assert jukebox existence and update the textChannel it 's writing into
 * and the voicechannel it's streaming into
 * @param evt message event leading to this function
 */
const _updateJukebox = async (evt: Message): Promise<boolean> => {
  const asker = evt.guild.members.get(evt.author.id);
  const voiceChannel = asker.voiceChannel;
  clearTimeout(timeout);
  if (!voiceChannel) {
    await evt.reply(
      "Tu dois être dans un canal vocal pour pouvoir lancer une commande !"
    );
    return false;
  }
  //Join user voicechannel
  if (
    !global.voiceConnection ||
    global.voiceConnection.channel.id != voiceChannel.id
  ) {
    global.voiceConnection = await voiceChannel.join();
    if (global.jukebox) global.jukebox.voiceConnection = global.voiceConnection;
  }

  if (!global.jukebox) {
    global.jukebox = new Jukebox(
      global.voiceConnection,
      evt.channel as TextChannel
    );
    global.jukebox.on("QueueEmpty", () => {
      evt.channel.send(
        "Liste de lecture vide! J'me casse dans 5 minutes les nuls !"
      );
      timeout = setTimeout(() => {
        global.voiceConnection.disconnect();
        evt.channel.send("Mon travail ici est terminé !");
        //Not really required actually, but helps GC cleaning the mess up
        global.voiceConnection = null;
      }, TIMEOUT_TIME);
    });
  }

  if (global.jukebox.textChannel.id != evt.channel.id) {
    global.jukebox.setTextChannel(evt.channel);
  }
  return true;
};
/**
 * @summary Starts the jukebox
 * @param evt Discord message Event
 * @param command Discord command string (ex : play, add, list)
 * @param cmdArg Ignoredf
 */
const play = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;

  if (global.jukebox.isPaused()) {
    global.jukebox.resume();
    return;
  }

  if (global.jukebox.isPlaying) {
    evt.channel.send(`La lecture est déjà en cours !`);
    return;
  }

  if (!global.jukebox.play()) {
    evt.channel.send(`Il n'y a pas de chanson dans la liste de lecture !`);
    return;
  }
};

/**
 * @summary Add a music to play
 * @param evt Discord message Event
 * @param command Discord command string (ex : play, add, list)
 * @param cmdArg Music to add
 */
const addToQueue = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;
  const addedBatch = getValids(cmdArg)
    .map(
      async (valid: string): Promise<number> => {
        const added = await global.jukebox.addMusic(valid, evt.author);
        if (!added[0]) {
          await evt.channel.send(added[1]);
        }
        return Number(added[0]);
      }
    )
    .reduce(async (acc, value) => (await acc) + (await value));
  if ((await addedBatch) === 0) {
    return;
  }
  await evt.channel.send(`Chansons à venir :`);
  await global.jukebox.displayQueue();
  if (!global.jukebox.isPlaying) {
    await play(evt, command, cmdArg);
  }
};

/**
 * @async
 * @public
 * @summary Starts the jukebox
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const stop = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;

  if (!global.jukebox.isPlaying) {
    evt.channel.send(`Il n'y a pas de musique en cours de lecture !`);
    return;
  }

  if (!global.jukebox.stop(false)) {
    evt.channel.send(`JE NE PEUX PAS ARRETER WAAA !!!1`);
    return;
  }

  if (global.voiceConnection) {
    evt.channel.send("K thx bye");
    global.voiceConnection.disconnect();
    global.voiceConnection = null;
  }
};

const removeFromQueue = async (
  evt: Message,
  command: string,
  cmdArg: string
) => {
  if (!(await _updateJukebox(evt))) return;
  const index = parseInt(cmdArg);
  if (isNaN(index)) {
    evt.channel.send(
      `Faut mettre le numéro de la chanson dans la liste tu sais...`
    );
    return;
  }

  if (!global.jukebox.removeFromQueue(index - 1)) {
    evt.channel.send(`Nop, y'a pas de chanson avec ce numéro`);
    return;
  }
  await evt.channel.send(`Chanson enlevée !`);
  await evt.channel.send(`Chansons à venir :`);
  await global.jukebox.displayQueue();
};

const removeAllFromQueue = async (
  evt: Message,
  command: string,
  cmdArg: string
): Promise<void> => {
  if (!(await _updateJukebox(evt))) return;
  global.jukebox.removeAllFromQueue();
  await evt.channel.send(`Liste de chansons vidée`);
};

/**
 * @async
 * @public
 * @summary loop the current song
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const loop = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;
  if (!global.jukebox.isPlaying) {
    evt.channel.send(`Il n'y a pas de musique en cours de lecture !`);
    return;
  }
  global.jukebox.setLoop(true);
  evt.channel.send(`Musique bouclée`);
};

/**
 * @async
 * @public
 * @summary stoops looping the current song
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const unloop = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;
  if (!global.jukebox.isPlaying) {
    evt.channel.send(`Il n'y a pas de musique en cours de lecture !`);
    return;
  }
  global.jukebox.setLoop(false);
  evt.channel.send(`Arrêt de la boucle`);
};

/**
 * @async
 * @public
 * @summary Pauses the jukebox
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const pause = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;

  if (!global.jukebox.isPlaying) {
    evt.channel.send(
      "C'est difficile de faire pause sans avoir commencé à jouer..."
    );
    return;
  }

  global.jukebox.pause();
};

/**
 * @async
 * @public
 * @summary Resume the jukebox
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const resume = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;

  if (!global.jukebox.isPaused()) {
    evt.channel.send("C'est difficile de reprendre sans faire pause...");
    return;
  }

  global.jukebox.resume();
};

/**
 * @async
 * @public
 * @summary Displays playlist
 * @param {Discord/Message} evt Discord message Event
 * @param {String} command Discord command string (ex : play, add, list)
 * @param {String} cmdArg Ignored
 */
const list = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;

  await global.jukebox.displayQueue();
};

/**
 * @summary Skip current song and starts next
 * @param evt Discord message Event
 * @param command Discord command string (ex : play, add, list)
 * @param cmdArg If specified, skip cmdArg song
 */
const skip = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;
  try {
    global.jukebox.skip();
  } catch (ex) {
    console.log(ex);
    evt.channel.send(`Impossible de passer la chanson`);
  }
};
/**
 * @async
 * @public
 * @summary Change playback volume
 * @param evt Change the volume of the playback
 * @param command Discord command string (ex : play, add, list)
 * @param cmdArg New volume
 */
const setVolume = async (evt: Message, command: string, cmdArg: string) => {
  if (!(await _updateJukebox(evt))) return;

  if (!global.jukebox.setVolume(cmdArg)) {
    evt.channel.send("Volume invalide. Il doit être compris entre 0 et 100");
    return;
  }
};

exports.default = {
  play: play,
  musique: play,
  addMusic: addToQueue,
  am: addToQueue,
  ajouter: addToQueue,
  enlever: removeFromQueue,
  rm: removeFromQueue,
  clear: removeAllFromQueue,
  vider: removeAllFromQueue,
  list: list,
  liste: list,
  pause: pause,
  resume: resume,
  reprendre: resume,
  volume: setVolume,
  skip: skip,
  passer: skip,
  son: setVolume,
  stop: stop,
  loop: loop,
  unloop: unloop
};

exports.help = {
  ajouter: {
    parameters: "URL d'une vidéo Youtube",
    desc: "Ajoute une musique à la liste de lecture",
    aliases: "am"
  },
  enlever: {
    parameters: "Numero de la musique dans la liste",
    desc: "Enlève une musique de la liste des musiques en attente",
    aliases: "rm"
  },
  liste: {
    parameters: "",
    desc: "Affiche la liste de lecture",
    aliases: "list"
  },
  play: {
    parameters: "",
    desc: "Balance la musique de la liste de lecture",
    aliases: "musique"
  },
  pause: {
    parameters: "",
    desc: "Met en pause la lecture de la musique en cours"
  },
  reprendre: {
    parameters: "",
    desc: "Reprends la lecture après une pause",
    aliases: "resume"
  },
  passer: {
    parameters: "",
    desc: "Arrête la chanson en cours et passe à la suivante",
    aliases: "skip"
  },
  son: {
    parameters: "Entier entre 0 et 100",
    desc: "Change le volume de la lecture",
    aliases: "volume"
  },
  stop: {
    parameters: "",
    desc: "Arrête la lecture",
    aliases: "volume"
  },
  vider: {
    parameters: "",
    desc: "Vide la liste de lecture lecture",
    aliases: "clear"
  }
};
