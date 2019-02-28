const io = require('socket.io');
var ss = require('socket.io-stream');
const fs = require('fs');
const {PassThrough} = require('stream')

async function streamingService(evt, command, cmdArg) {
    console.log("muh");
    const sock = io.listen(3003);
    //Game master
    const GM = evt.guild.members.get(evt.author.id);

    let voiceChannel = GM.voiceChannel;

    if (!voiceChannel) {
        evt.reply("Il faut être dans un canal de discussion avant de commencer !");
        throw new Error("Gm is not in a vocal channel")
    }
    const voiceConnection =
        await voiceChannel
        .join()
        .catch(() => {
            throw new Error(`Unable to join ${voiceChannel.name}`);
        });
    //Play something to allow us to receive voice data 
    const audioStream = new PassThrough();
    sock.on("connection", socket => {
        console.log("Client connected");
        ss(socket).on('audio-data', (stream, data) => {
            console.log("data");
            voiceConnection.playStream(stream);
            //stream.pipe(audioStream);
        })
    })
    
}

exports.default = {
    musicgui: streamingService,
    mgui: streamingService,

}

exports.help = {
    'musicgui': {
        parameters: "",
        desc: "Démarre le service de stream différé",
        aliases: "mgui"
    }
};