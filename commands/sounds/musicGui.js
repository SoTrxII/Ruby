//import { createReadStream } from 'fs';
const io = require('socket.io')(8089);
const debug = require('debug')('command_musicGui');
const {writeFile, readFile, access, F_OK} = require('fs').promises;
const playlistsDir = `${global.baseAppDir}/../playlists`;


//import { VoiceConnection } from 'discord.js';
const {
    join
} = require("path");
const MusicGui = require(join(global.baseAppDir, 'classes', 'MusicGui.js'));

const isConsole = true;
let gui = null;

const listen = async (evt) => {

    const asker = evt.guild.members.get(evt.author.id);
    const voiceChannel = asker.voiceChannel;

    if (!voiceChannel) {
        evt.reply("Tu dois être dans un canal vocal pour pouvoir lancer une commande !");
        return;
    }
    //Join user voicechannel
    if (!global.voiceConnection || global.voiceConnection.id != voiceChannel.id) {
        global.voiceConnection = await voiceChannel.join()
    }
    const gui = new MusicGui(
        global.voiceConnection,
        evt.channel,
        "pulse"
    );

    //const id = gui.addSong("https://www.youtube.com/watch?v=y_FfrgoVoLk")
    const id = gui.addSong("https://www.youtube.com/watch?v=lAIGb1lfpBw");
    //console.log("Id : " + id);
    gui.playSong(id);
    const id2 = gui.addSong("https://www.youtube.com/watch?v=y_FfrgoVoLk");
    //console.log("Id : " + id2);
    gui.playSong(id2);
    //gui.setSongVolume(id2, 20);

    //gui.stopSong(id);

    //Test pause
    /*setTimeout(() => {
        gui.pauseSong(id);
        setTimeout( () => {
            gui.playSong(id);
        }, 10000);
    }, 10000);*/

    //test stop
    /*setTimeout(() => {
        gui.stopSong(id);
        setTimeout( () => {
            gui.playSong(id);
        }, 10000);
    }, 10000);*/

    //test volume
    setTimeout(() => {
        gui.setSongVolume(id, 20);
        setTimeout(() => {
            gui.setSongVolume(id, 80);
        }, 10000);
    }, 10000);

    //test time fetch
    /*setTimeout(() => {
        //gui.setSongVolume(id, 20);
        gui.fetchTime(id, "0:00");
        console.log("FETCH2");
        
        setTimeout(() => {
            gui.fetchTime(id, "0:40");
            console.log("FETCH3");
        }, 20000);
    }, 10000);*/


};

const cListen = async (evt) => {
    isConsole = true;

};
const _initMusicGui = async (evt, command, cmdArgs) => {
    const asker = evt.guild.members.get(evt.author.id);
    const voiceChannel = asker.voiceChannel;

    if (!voiceChannel) {
        evt.reply("Tu dois être dans un canal vocal pour pouvoir lancer une commande !");
        return;
    }
    //Join user voicechannel
    if (!global.voiceConnection || global.voiceConnection.id != voiceChannel.id) {
        global.voiceConnection = await voiceChannel.join()
    }
    gui = new MusicGui(
        global.voiceConnection,
        evt.channel,
        "pulse"
    );
};
const addMusic = async (evt, command, cmdArgs) => {
    if (!gui) {
        await _initMusicGui(evt, command, cmdArgs);
    }
    const id = gui.addSong(cmdArgs);
    if (id == null) {
        evt.channel.send("Ce lien n'est pas supporté !");
        return;
    }
    evt.channel.send(`Musique ajoutée avec l'identifiant :  ${id}, On tente de la jouer !`);
    gui.playSong(id);

};
const playMusic = async (evt, command, cmdArgs) => {
    if (!gui) {
        await _initMusicGui(evt, command, cmdArgs);
    }
    const id = gui.addSong(cmdArgs);
    if (id != null) {
        evt.channel.send(`Musique ajoutée avec l'identifiant :  ${id}`);
    }

};

const stopMusic = async (evt, command, cmdArgs) => {
    if (!gui) {
        await _initMusicGui(evt, command, cmdArgs);
    }
    const id = gui.stopSong(cmdArgs);
    if (!id) {
        evt.channel.send("Cet id est invalide (baka) !");
    }
    evt.channel.send(`Musique avec l'identifiant :  ${cmdArgs} arrêtée !`);
};

const loopMusic = async (evt, command, cmdArgs) => {
    if (!gui) {
        await _initMusicGui(evt, command, cmdArgs);
    }
    const id = gui.loopSong(cmdArgs);
    if (!id) {
        evt.channel.send("Cet id est invalide (baka) !");
        return;
    }
    evt.channel.send(`Musique avec l'identifiant :  ${cmdArgs} loopée !`);
};

const unloopMusic = async (evt, command, cmdArgs) => {
    if (!gui) {
        await _initMusicGui(evt, command, cmdArgs);
    }
    const id = gui.unloopSong(cmdArgs);
    if (!id) {
        evt.channel.send("Cet id est invalide (baka) !");
        return;
    }
    evt.channel.send(`Musique avec l'identifiant :  ${cmdArgs} unloopée !`);
};

const setVol = async (evt, command, cmdArgs) => {
    if (!gui) {
        await _initMusicGui(evt, command, cmdArgs);
    }
    splitCmds = cmdArgs.split(' ');
    const id = gui.setSongVolume(splitCmds[0], splitCmds[1]);
    if (!id) {
        evt.channel.send("Cet id est invalide (baka) !");
        return;
    }
    evt.channel.send(`Musique avec l'identifiant :  ${splitCmds[0]} a maintenant son volume à ${splitCmds[1]} !`);
};

const fetchTime = async (evt, command, cmdArgs) => {
    if (!gui) {
        await _initMusicGui(evt, command, cmdArgs);
    }
    splitCmds = cmdArgs.split(' ');
    const id = gui.fetchTime(splitCmds[0], splitCmds[1]);
    if (!id) {
        evt.channel.send("Cet id est invalide (baka) !");
        return;
    }
    evt.channel.send(`Musique avec l'identifiant :  ${splitCmds[0]} a maintenant son temps à ${splitCmds[1]} !`);
};

async function getOldPlaylist(id) {
    const exists = access(`${playlistsDir}/${id}`, F_OK);
    debug("Checked");
    if (!exists) {
        debug("No playlist file found !");
        return null;
    }
    const data = await readFile(`${playlistsDir}/${id}`).catch(e => debug(e));
    return JSON.parse(data)
}

const tListen = async (evt) => {
    const asker = evt.guild.members.get(evt.author.id);
    const voiceChannel = asker.voiceChannel;


    if (!voiceChannel) {
        evt.reply("Tu dois être dans un canal vocal pour pouvoir lancer une commande !");
        return;
    }
    //Join user voicechannel
    if (!global.voiceConnection || global.voiceConnection.id != voiceChannel.id) {
        global.voiceConnection = await voiceChannel.join()
    }
    const gui = new MusicGui(
        global.voiceConnection,
        evt.channel,
        "pulse"
    );


    io.on("connection", (socket) => {
        debug("A user connected ");
        socket.emit("connected");
        let oldSongs = getOldPlaylist(evt.author.id);
        oldSongs.then(os => {
            debug("oldSongs");
            debug(oldSongs);
            socket.emit("syncOld", os);
        });


        socket.on("add", (link) => {
            debug(`trying to add song with link : ${link}`);
            const id = gui.addSong(link);
            if (id == null) {
                socket.emit("addError", link);
                debug(`Failed to add song with link : ${link}`);
            } else {
                socket.emit(`addSuccess${link}`, id);
                debug(`Succeded in adding song with link : ${link}`);
            }
        });

        socket.on("remove", (id) => {
            debug(`trying to remove song with link : ${id}`);
            const hasBeenRemoved = gui.removeSong(id);
            if (!hasBeenRemoved) {
                socket.emit("removeError", id);
                debug(`Failed to remove song with id : ${id}`);
            } else {
                socket.emit(`removeSuccess${id}`, id);
                debug(`Succeded in removing song with link : ${id}`);
            }
        });

        socket.on("play", (id) => {
            debug(`trying to play song with id : ${id}`);
            const played = gui.playSong(id);
            if (!played) {
                socket.emit("playError", id);
                debug(`Could not play song with id: ${id}`);
            } else {
                debug(`Now playing song with id: ${id}`);
            }
        });

        socket.on("loop", (id) => {
            debug(`trying to loop song with id : ${id}`);
            const played = gui.loopSong(id);
            if (!played) {
                socket.emit("loopError", id);
                debug(`Could not loop song with id: ${id}`);
            } else {
                debug(`Now looping song with id: ${id}`);
            }
        });

        socket.on("unloop", (id) => {
            debug(`trying to unloop song with id : ${id}`);
            const played = gui.unloopSong(id);
            if (!played) {
                socket.emit("unloopError", id);
                debug(`Could not unloop song with id: ${id}`);
            } else {
                debug(`Now unlooping song with id: ${id}`);
            }
        });

        socket.on("pause", (id) => {
            debug(`trying to pause song with id : ${id}`);
            const paused = gui.pauseSong(id);
            if (!paused) {
                socket.emit("pauseError", id);
                debug(`Could not pause song with id: ${id}`);
            } else {
                debug(`Now pausing song with id: ${id}`);
            }
        });

        socket.on("stop", (id) => {
            debug(`trying to stop song with id : ${id}`);
            const stopped = gui.stopSong(id);
            if (!stopped) {
                socket.emit("stopError", id);
                debug(`Could not stop song with id: ${id}`);
            } else {
                debug(`Now stopping song with id: ${id}`);
            }
        });

        socket.on("volume", ({id, volume}) => {
            debug(`trying to change the volume of song with id : ${id} to : ${volume}`);
            const stopped = gui.setSongVolume(id, volume);
            if (!stopped) {
                socket.emit("volumeError", id, volume);
                debug(`Failed to change the volume of song with id : ${id} to : ${volume}`);
            } else {
                debug(`trying to change the volume of song with id : ${id} to : ${volume}`);
            }
        });

        socket.on("fetch", ({id, time}) => {
            debug(`trying to change the time of song with id : ${id} to : ${time}`);
            const stopped = gui.fetchTime(id, time).then((fetched) => {
                if (fetched) {
                    debug(`trying to change the time of song with id : ${id} to : ${time}`);
                    socket.emit(`fetchSuccess${id}`)
                } else {
                    debug(`Failed to change the time of song with id : ${id} to : ${time}`);
                    socket.emit("fetchError", id, time);
                }

            });
        });

        socket.on("syncTime", (id) => {
            debug(`Getting time of song with id : ${id}`);
            const time = gui.getCurrentTimeInSeconds(id);
            if (time === undefined) {
                socket.emit(`syncTimeError${id}`, id);
                debug(`Failed to fetch the time of song with id : ${id}. Got : ${time}`);
            } else {
                socket.emit(`syncTimeSuccess${id}`, time);
                debug(`Time of song with id ${id} is ${time}`);
            }
        });

        socket.on("disconnect", () => {
            const tracks = JSON.stringify(gui.allTracks);
            debug(tracks);
            debug(`${playlistsDir}/${evt.author.id}`);
            writeFile(`${playlistsDir}/${evt.author.id}`, tracks).then(() => {
                evt.channel.send(`Playlist sauvegardée !`);
            });
            gui.reset();

        })


    });
};

exports.default = {
    listen: listen,
    cListen: cListen,
    io: tListen,
    ai: addMusic,
    si: stopMusic,
    li: loopMusic,
    uli: unloopMusic,
    sv: setVol,
    fi: fetchTime

};