const EventEmitter = require('events');
const debug = require('debug')('musicGui');
const ffmpeg = require('fluent-ffmpeg');
const GuiItemFactory = require("./GuiItemFactory.js");
const GuiItem = require("./GuiItem.js");
const Speaker = require("speaker");
const Volume = require("pcm-volume");
const {PassThrough, pipeline} = require('stream');
const fs = require('fs');

/**
 * @class
 * @extends EventEmitter
 */
class MusicGui extends EventEmitter {

    constructor(voiceConnection, textChannel) {
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
        this.textChannel = textChannel;

        /**
         * @private
         * @member {Map<String, GuiItem>} songs List of music that can be played
         */
        this.songs = new Map();

        /**
         * @private
         * @member {Stream} audioLoop audio stream coming from the main audio card
         */
        this.audioLoop = new PassThrough();

        this.timemark = null;
        /**
         * @private
         * @member audioCommand Command extracting audio samples from the main audio card
         */
        this.audioCommand = ffmpeg()
            .on('start', function (commandLine) {
                console.log('Spawned Ffmpeg with command: ' + commandLine);
            })
            .once("progress", () => {
                this.startLink();
            })
            .input("0")
            .inputFormat("pulse")
            .outputFormat("s16le")
            .addOption("-analyzeduration 0")
            .audioCodec("pcm_s16le")
            .audioBitrate("64k")
            .output(this.audioLoop, {end: false})
            .run();


        this.on("songEnd", this._endHandler);

    }

    get allTracks() {
        return Array.from(this.songs.values()).map(s => s.track);
    }

    /**
     * Trigerred each time a song end, check if the song
     * has to be relooped
     * @param {String} id
     */
    _endHandler(id) {
        const song = this.songs.get(id);
        if (song == null) {
            console.error("[WTF] The song that just ended doesn't exists ?");
            return;
        }
        if (song.isLooping) {
            this.stopSong(id);
            this.playSong(id);
        }
    }

    /**
     * Return the tim in seconds
     * @param id
     * @returns {number|null|*|undefined}
     */
    getCurrentTimeInSeconds(id) {
        const song = this.songs.get(id);
        if (song == null) {
            return undefined;
        }
        if (song.state == GuiItem.STATE.STOPPED) {
            return 0;
        }
        return this.hmsToSecondsOnly(this.timemark) + this.hmsToSecondsOnly(this.song.startTime);
    }

    hmsToSecondsOnly(str) {
        var p = str.split(':'),
            s = 0, m = 1;

        while (p.length > 0) {
            s += m * parseInt(p.pop(), 10);
            m *= 60;
        }

        return s;
    }

    /**
     * Add a song to the available list
     * @param {String} link Link of music to play
     * @return {String?} id of the song or null the song couldn't be added
     */
    addSong(link) {
        const id = this._generateId();
        const item = GuiItemFactory.createItem(link);
        //Item fitting the link couldn't be found
        if (item == null) {
            return null;
        }
        this.songs.set(
            id,
            item
        );
        return id;
    }

    /**
     * Set a song in a looping state, playing it until it's stopped
     * @param {String} id id of the song to play
     */
    loopSong(id) {
        const song = this.songs.get(id);
        if (song == null) {
            return false;
        }
        song.isLooping = true;
        return true;
    }

    /**
     * Remove the song looping state
     * @param {String} id id of the song to play
     */
    unloopSong(id) {
        const song = this.songs.get(id);
        if (song == null) {
            return false;
        }
        song.isLooping = false;
        return true;
    }

    /**
     * Build the command to transform any
     * readable stream into a pure PCM stream
     * @param {ReadableStream} input Base stream to process
     * @param {String} startTime Offset to begin stream
     * @returns FFmpeg command
     */
    _buildFfmpegCommand(input, startTime, outStream, id) {
        const command =
            ffmpeg(input)
                .on('start', function (commandLine) {
                    console.log('Spawned video Ffmpeg with command: ' + commandLine);
                })
                .on('error', function (commandLine) {
                    console.log('Spawned video Ffmpeg with error: ' + commandLine);
                })
                .on("progress", (progress) => {
                    console.log(progress);
                    this.timemark = progress.timemark;
                    this.emit(`songProgress${id}`);
                    //es(command);
                })
                .on("end", () => {
                    this.emit("songEnd", id)
                })
                .audioCodec('pcm_s16le')
                .format('s16le')
                .addOption('-map 0:a')
                .addOption("-strict -2")
                .addOption("-analyzeduration 0")
                //.preset("ultrafast")
                .audioFrequency("48k")
                .audioBitrate("64k");
        if (startTime) {
            command.seekInput(startTime);
        }
        command.stream(outStream, {
            //highWaterMark : 20 * 1024 * 1024
        });

        return command;
    }

    /**
     * Play the song identified by id, either PAUSED or STOPPED
     * @param {String} id Song's id
     * @param {String} startTime Offset to start with
     */
    playSong(id, startTime, volume = 1) {
        const song = this.songs.get(id);
        if (song == null) {
            return false;
        }
        if (song.state == GuiItem.STATE.PAUSED) {
            song.unmute();
            // Make process continue
            song.ffmpeg.kill("SIGCONT");
            song.state = GuiItem.STATE.PLAYING;
        } else if (song.state == GuiItem.STATE.STOPPED) {
            song.speaker = new Speaker({
                channels: 2,
                bitDepth: 16,
                sampleRate: 48000,
                signed: true,
                //samplesPerFrame: 1024,
                device: 'pulse' //this._config.hardwareOutput || `hw:0,0,1`
            });
            song.speaker.on("error", (err) => {
                debug(err);
            });
            const musicStream = new PassThrough();
            song.startTime = startTime;
            song.ffmpeg = this._buildFfmpegCommand(song.stream, startTime, musicStream, id);
            song.volumeStream = new Volume(volume);
            pipeline(
                musicStream,
                song.volumeStream,
                song.speaker
            );
            song.state = GuiItem.STATE.PLAYING
        } else {
            return false;
        }

    }

    /**
     * Stops the song from playing and clean up the mess
     * @param {String} id
     */
    stopSong(id) {
        const song = this.songs.get(id);
        if (song == null || song.state == GuiItem.STATE.STOPPED) {
            debug("Song already stopped !");
            return false;
        }
        try {
            song.speaker.close();
        } catch (e) {
            //
        }

        song.ffmpeg.kill();
        song.ffmpeg.on("error", () => {
            debug("FFMPEG for song " + id + "has been succesfully killed");
        });
        song.ffmpeg = null;
        song.speaker = null;
        song.volumeStream = null;
        //Regenerate stream
        song.createStream();
        song.state = GuiItem.STATE.STOPPED;
        return true;
    }

    /**
     * Forward the song to a specific time
     */
    async fetchTime(id, time) {
        const song = this.songs.get(id);
        if (song == null) {
            return false;
        }
        const oldVolume = song.volume;
        if (song.state != GuiItem.STATE.STOPPED) {
            this.stopSong(id);
        }
        const that = this;
        const progressProm = new Promise((res, rej) => {
            that.on(`songProgress${id}`, () => {
                res(true);
            });
        });
        this.playSong(id, time, oldVolume);
        return await progressProm;
    }

    /**
     * Set a specific song loudness
     * @param {String} id song's if
     * @param {String | Integer} volume loudness in %
     * @returns false if song doesn't exists
     */
    setSongVolume(id, volume) {
        const song = this.songs.get(id);
        if (song == null) {
            return false;
        }
        try {
            song.volume = volume;
        } catch (err) {
            debug("Invalid volume");
            return false;
        }
        return true;

    }

    /**
     * Pause a currently playing song
     * @param {String} id Song id
     */
    pauseSong(id) {
        const song = this.songs.get(id);
        if (song == null || song.state != GuiItem.STATE.PLAYING) {
            debug("Cannot pause a song that isn't playing !");
            return false;
        }
        //Suspending the process takes actually
        //quite a lot of time (a few seconds), so we mute the stream before
        //so the user can obtain the same result
        song.mute();
        // equiv CTRL-Z, suspend process
        song.ffmpeg.kill("SIGSTOP");
        song.state = GuiItem.STATE.PAUSED;
        return true;
    }

    /**
     *
     * @param {String} id Song identifier
     * @returns {Boolean} True if deleted, false if not found
     */
    removeSong(id) {
        const song = this.songs.has(id);
        if (!song) {
            return false;
        }
        this.stopSong(id);
        this.songs.delete(id);
    }

    /**
     * Generate a random id
     */
    _generateId() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    /**
     * Start to link the audio card output to discord input
     */
    startLink() {
        this._voiceConnection.playConvertedStream(this.audioLoop, {
            bitrate: 48000,
            passes: 1
        });
    }

    reset() {
        Array.from(this.songs.keys()).forEach(id => this.stopSong(id));
        this.songs = new Map();
    }

    /**
     * Stops to link the audio card output to discord input
     */
    stopLink() {
        //this.audioCommand.kill();
        this.cardLink.stop();
    }


}

module.exports = MusicGui;