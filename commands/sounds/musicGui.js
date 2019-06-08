//import { createReadStream } from 'fs';
//import { VoiceConnection } from 'discord.js';
const portAudio = require('naudiodon');
const {
    join
} = require("path");
const MusicGui = require(join(global.baseAppDir, 'classes', 'MusicGui.js'));
console.log(portAudio.getDevices());

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


function _findCard(name){
    console.log(portAudio.getDevices());
    const devices =portAudio.getDevices();
    return devices.filter((card) => card.name == name);
}

exports.default = {
    listen : listen

}