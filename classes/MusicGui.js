const EventEmitter = require('events');
const debug = require('debug')('musicGui');
const ffmpeg = require('fluent-ffmpeg');
const portAudio = require('naudiodon');
const GuiItemFactory = require("./GuiItemFactory.js");
const GuiItem = require("./GuiItem.js");
const Speaker = require("speaker");
const Volume = require("pcm-volume");

/**
 * @class
 * @extends EventEmitter
 */
class MusicGui extends EventEmitter {

    constructor(voiceConnection, textChannel, cardName="default") {
        super();

        if (!voiceConnection || !textChannel) {
            throw new Error("No voiceConnection or textChannel specified");
        }

        /**
         * @private
         * @member {Discord/voiceConnection} voiceConnection Discord connection to a voice channel
         */
        this._voiceConnection = voiceConnection;

        /**
         * @public
         * @member {Discord/Channel} textChannel Discod channel to post update in
         */
        this.textChannel = textChannel

        /**
         * @private
         * @member {Map<String, GuiItem>} songs List of music that can be played
         */
        this.songs = new Map();

        const inCard = this._findCard("pulse");
        //const outCard = this._findCard("hdmi");


        /*this.cardLinkOut = new portAudio.AudioIO({
              outOptions: {
                  channelCount: 2,
                  sampleFormat: portAudio.SampleFormat16Bit,
                  sampleRate: 44100,
                  deviceId: outCard.id // Use -1 or omit the deviceId to select the default device
              }
        });*/

        this.cardLink = new portAudio.AudioIO({
                inOptions: {
                    channelCount: 2,
                    sampleFormat: portAudio.SampleFormat16Bit,
                    sampleRate: 44100,
                    deviceId: inCard.id // Use -1 or omit the deviceId to select the default device
                }
        });

        this.startLink();

    }

    /**
     * Add a song to the available list 
     * @param {String} link Link of music to play
     * @return {String?} id of the song or null the song couldn't be added
     */
    addSong(link){
        const id = this._generateId();
        const item = GuiItemFactory.createItem(link);
        //Item fitting the link couldn't be found 
        if(item == null){
            return null;
        }
        this.songs.set(
            id,
            item
        );
        return id;
    }

    /**
     * Build the command to transform any
     * readable stream into a pure PCM stream
     * @param {ReadableStream} input Base stream to process
     * @param {String} startTime Offset to begin stream
     * @returns FFmpeg command
     */
    _buildFfmpegCommand(input, startTime){
        const command = 
            ffmpeg(input)
                .noVideo()
                .outputFormat("s16le")
                .audioCodec("pcm_s16le");
        if(startTime){
            command.seekInput(startTime);
        }
        return command;
    }

    /**
     * Play the song identified by id, either PAUSED or STOPPED
     * @param {String} id Song's id
     * @param {String} startTime Offset to start with
     */
    playSong(id, startTime){
        const song = this.songs.get(id);
        if(song == null){
            return false;
        }
        if(song.state == GuiItem.STATE.PAUSED){
            // Make process continue
            song.ffmpeg.kill("SIGCONT");
            song.state = GuiItem.STATE.PLAYING;
        }
        else if(song.state == GuiItem.STATE.STOPPED){
            console.log(song);
            song.speaker = new Speaker({
                channels: 2,
                bitDepth: 16,
                sampleRate: 48000,
                samplesPerFrame: 200,
                device: 'pulse' //this._config.hardwareOutput || `hw:0,0,1`
            });
            song.ffmpeg = this._buildFfmpegCommand(song.stream, startTime);
            song.volumeStream = new Volume();
            song.ffmpeg.pipe(song.volumeStream).pipe(song.speaker);
            song.state = GuiItem.STATE.PLAYING
        }else{
            return false;
        }

    }

    /**
     * Stops the song from playing and clean up the mess
     * @param {String} id 
     */
    stopSong(id){
        const song = this.songs.get(id);
        if (song == null || song.state == GuiItem.STATE.STOPPED) {
            debug("Song already stopped !");
            return false;
        }
        song.ffmpeg.kill();
        song.ffmpeg.on("error", () => {
            debug("FFMPEG for song " + id + "has been succesfully killed");
            
            //song.speaker.close();
        });
        song.ffmpeg = null;
        song.speaker = null;
        song.volumeStream = null;
        //Regenerate stream
        song.createStream();
        song.state = GuiItem.STATE.STOPPED;
    }

    /**
     * Forward the song to a specific time
     */
    fetchTime(id, time){
        console.log("FETCH");
        const song = this.songs.get(id);
        if (song == null) {
            return false;
        }
        //console.log(song);
        //this.stopSong(id);
        if(song.state != GuiItem.STATE.STOPPED){
            this.stopSong(id);
        }
        this.playSong(id, time);

    }

    /**
     * Set a specific song loudness
     * @param {String} id song's if
     * @param {String | Integer} volume loudness in %
     * @returns false if song doesn't exists 
     */
    setSongVolume(id, volume){
        const song = this.songs.get(id);
        if (song == null) {
            return false;
        }
        try{
            song.volume = volume;
        }catch(err){
            debug("Invalid volume");
        }
        
    }

    /**
     * Pause a currently playing song
     * @param {String} id Song id 
     */
    pauseSong(id){
        const song = this.songs.get(id);
        if (song == null || song.state != GuiItem.STATE.PLAYING) {
            debug("Cannot pause a song that isn't playing !")
            return false;
        }
        // equiv CTRL-Z, suspend process
        song.ffmpeg.kill("SIGSTOP");
        song.state = GuiItem.STATE.PAUSED;
    }



    /**
     * 
     * @param {String} id Song identifier
     * @returns {Boolean} True if deleted, false if not found
     */
    removeSong(id){
        return this.songs.delete(id);
    }

    /**
     * Generate a random id
     */
    _generateId(){
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Start to link the audio card output to discord input
     */
    startLink(){
        this.cardLink.start();
        
        this._voiceConnection.playConvertedStream(this.cardLink);
    }

    /**
     * Stops to link the audio card output to discord input
     */
    stopLink(){
        this.cardLink.stop();
    }

    _findCard(name) {
        console.log(portAudio.getDevices());
        const devices = portAudio.getDevices();
        return devices.filter((card) => card.name == name);
    }


}

module.exports = MusicGui;