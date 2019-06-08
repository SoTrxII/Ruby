//import { createReadStream } from 'fs';
var io = require('socket.io')(8089);
const debug = require('debug')('command_musicGui');

//import { VoiceConnection } from 'discord.js';
const {
    join
} = require("path");
const MusicGui = require(join(global.baseAppDir, 'classes', 'MusicGui.js'));

const listen = async (evt) => {

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


}

const tListen = async (evt) => {
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
    const gui = new MusicGui(
        global.voiceConnection,
        evt.channel,
        "pulse"
    );

    io.on("connection", () => {
        debug("A user connected ");

        io.on("add", (link) => {
            debug(`trying to add song with link : ${link}`);
            const id = gui.addSong(link);
            if(id == null){
                io.emit("addError", link);
                debug(`Failed to add song with link : ${link}`);
            }else{
                debug(`Succeded in adding song with link : ${link}`);
            }
        });

        io.on("play", (id) => {
            debug(`trying to play song with id : ${id}`);
            const played = gui.playSong(id);
            if(!played){
                io.emit("playError", id);
                debug(`Could not play song with id: ${id}`);
            }else{
                debug(`Now playing song with id: ${id}`);
            }
        });

        io.on("pause", (id) => {
            debug(`trying to pause song with id : ${id}`);
            const paused = gui.pauseSong(id);
            if (!paused) {
                io.emit("pauseError", id);
                debug(`Could not pause song with id: ${id}`);
            } else {
                debug(`Now pausing song with id: ${id}`);
            }
        });

        io.on("stop", (id) => {
            debug(`trying to stop song with id : ${id}`);
            const stopped = gui.stopSong(id);
            if (!stopped) {
                io.emit("stopError", id);
                debug(`Could not stop song with id: ${id}`);
            } else {
                debug(`Now stopping song with id: ${id}`);
            }
        });

        io.on("volume", (id, volume) => {
            debug(`trying to change the volume of song with id : ${link} to : ${volume}`);
            const stopped = gui.setSongVolume(id, volume);
            if (!stopped) {
                io.emit("volumeError", id,volume);
                debug(`Failed to change the volume of song with id : ${link} to : ${volume}`);
            } else {
                debug(`trying to change the volume of song with id : ${link} to : ${volume}`);
            }
        });

        io.on("fetch", (id, time) => {
            debug(`trying to change the time of song with id : ${link} to : ${time}`);
            const stopped = gui.fetchTime(id, time);
            if (!stopped) {
                io.emit("fetchError", id, time);
                debug(`Failed to change the time of song with id : ${link} to : ${time}`);
            } else {
                debug(`trying to change the time of song with id : ${link} to : ${time}`);
            }
        });


    });
}

exports.default = {
    listen : listen

}