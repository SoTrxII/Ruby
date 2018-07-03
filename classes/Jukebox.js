const EventEmitter = require('events');
const JukeboxItem = require('./JukeboxItem');
const JukeboxYoutubeItem = require('./JukeboxYoutubeItem');
const JukeboxLocalItem = require('./JukeboxLocalItem');
const debug = require('debug')('jukebox')

//youTube.setKey("AIzaSyDLxs-tX86li5_i42cWI0-0kTwR8jBF7V4");
/**
 * @class
 * @extends EventEmitter
 */
class Jukebox extends EventEmitter {

    constructor(voiceConnection, textChannel) {
        super();

        if (!voiceConnection || !textChannel) {
            throw new Error("No voiceConnection or textChannel specified");
        }

        /**
         * @public
         * @member {Discord/voiceConnection} voiceConnection Discord connection to a voice channel
         */
        this.voiceConnection = voiceConnection;

        /**
         * @public
         * @member {Discord/Channel} textChannel Discod channel to post update in
         */
        this.textChannel = textChannel

        /**
         * @private
         * @member {JukeboxItem[]} _playQueue List of music to be played
         */
        this._playQueue = [];

        /**
         * @private
         * @member {Object} _supportedSources Enum of valid sources to play
         * @todo Implements spotify and fanburst
         */
        this._supportedSources = Object.freeze({
            YOUTUBE: Symbol("youtube"),
            SPOTIFY: Symbol("spotify"),
            FANBURST: Symbol("fanburst"),
            LOCAL: Symbol("local")
        });

        /**
         * @public
         * @member isPlaying Is the Jukebox playing right now ?
         */
        this.isPlaying = false;

        /**
         * @public
         * @member volume playback volume
         */
        this.volume = 60;

        /**
         * @private
         * @member _regYoutube Regex to recognize youtube links
         */
        this._regYoutube = /^((https?\:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.*v=(.[^&]+))(&list=.[^&]+)?.*$/


    }
    /**
     * @public
     * @param {String} track Source track to add to the playlist
     * @param {Discord/Member} asker Who's aking to add it
     * @returns {Boolean} True if the track was added
     */
    addMusic(track, asker) {

        let source = this._getSource(track);
        if (!source) {
            return false;
        }
        
        this._playQueue.push(this._createNewItem(track, source, asker))
        debug(`Ajout de musique, nouvelle longueur de file : ${this._playQueue.length}`)
        return true;
    }

    /**
     * @public
     * Begin playing the songs in the queue
     * @returns false if could not play
     * @listens JukeboxItem#end for relooping
     */
    play() {

        if (this.isPlaying) {
            throw new Error("The jukebox is already playing !")
        }

        if (!this._nextSong()) {
            return false;
        }

        this.isPlaying = true;

        debug(this.currentSong);

        //Send details about the song (async,
        //as we don't really need to wait for it to resolve)
        this.currentSong.toEmbed().then(async (embed) => {
            await this.textChannel.send("Chanson en cours : ")
            this.textChannel.send({
                embed
            });
        })


        this.currentSong.play({
            volume: this.volume / 100
        });
        //Loop after song
        //setTimeout( () => this.currentSong.on('end', (evt) => this.onEnd(evt), 5000));
        return true;
    }

    /**
     * Event handler for @see{@link{JukeboxItem#end}}
     * @summary What to do at the end of a track
     * @param {Event} evt on end event parameter
     */
    onEnd(evt) {
        debug("END")
        this.currentSong.off('end');
        this.isPlaying = false;
        this.play();
    }

    /**
     * @async
     * @public 
     * Display the playing queue into the discord channel
     */
    async displayQueue() {
        if (this._playQueue.length == 0) {
            this.textChannel.send("Liste vide !")
            return;
        }
        let index = 0;
        let string = ``;
        for (const item of this._playQueue) {
            string += `${++index})  ${await item.toString()}\n`
        }
        this.textChannel.send(string)
    }

    /**
     * @public
     * Change playback volume
     * @param {Integer} newVolume 
     * @return False if parameters is invalid, false otherwise
     */
    setVolume(newVolume) {
        if (!parseInt(newVolume) || !isFinite(newVolume) || isNaN(newVolume) ||
            newVolume < 0 || newVolume > 100) {
            return false;
        }

        this.volume = newVolume;
        if (this.isPlaying) {
            this.currentSong.setVolume(newVolume / 100);
        }
        return true;
    }

    /**
     * @public
     * Skip current song and go to the next one
     * @returns False if there is no next song
     */
    skip() {
        this.currentSong.stop()
        return true;
    }

    /**
     * @public
     * Jump to n-th element in the queue
     * @param {Integer} songIndex 
     * @throws If index is not valid
     * 
     */
    skipTo(songIndex) {

        if (songIndex < 0 || this._playQueue.lenght < songIndex + 1) {
            throw new Error("Invalid song index");
        }
        debug(songIndex)

        //Skip songs, skipTo(0) should be an alias to skip()
        if (songIndex > 0) {
            this._playQueue.splice(0, songIndex)
        }
        this.currentSong.off('end', this.onEnd);
        if (this.currentSong.stop()) {
            this.isPlaying = false;
            this.play();
        }


    }
    /**
     * @public
     * Stop the playback
     * @returns True if stopped
     */
    stop() {
        let hasWorked = this.currentSong.stop()
        if (hasWorked) {
            this.isPlaying = false;
        }
        return hasWorked;
    }

    /**
     * @public
     * Check if the jukebox is paused
     * @returns {Boolean}
     */
    isPaused() {
        return this.currentSong.isPaused;
    }

    /**
     * @public
     * Pause the playback
     * @returns false if could not pause the playback
     */
    pause() {
        if (this.currentSong.pause()) {
            return true;
        }
        return false;

    }

    /**
     * @public
     * Resume the playback
     * @returns false if could not resume the playback
     */
    resume() {
        if (this.currentSong.resume()) {
            return true;
        }
        return false;
    }

    /**
     * @public
     * @param {Discord/textChannel} textChannel 
     */
    setTextChannel(textChannel) {
        this.textChannel = textChannel;
    }

    /**
     * @private
     * Take the next song in queue
     * @fires Jukebox#QueueEmpty
     * @returns False if could not get next song
     */
    _nextSong() {
        debug(`Longueur de la file : ${this._playQueue.length}`);
        if (!this._playQueue.length) {
            /**
             * Emitted when there are no more songs to play.
             * @event Jukebox#QueueEmpty
             */
            this.emit('QueueEmpty');
            this.isPlaying = false;
            return false;
        }
        if (this.currentSong) {
            this.currentSong.stop();
            this.isPlaying = false;
        }
        this.currentSong = this._playQueue.shift();

        return true;
    }

    /**
     * Check if the music is from a supported input and returns it
     * @private
     * @param {String} track source to check
     * @returns {(Symbol | Boolean)} Source or false if not found
     * 
     * @todo implements dis
     */
    _getSource(track) {
        if (this._regYoutube.test(track)) {
            debug(`Source de l'ajout : Youtube`)
            return this._supportedSources.YOUTUBE;
        }

        if (JukeboxLocalItem.getLocalSongList().includes(track)) {
            debug(`Source de l'ajout : Local`)
            return this._supportedSources.LOCAL;
        }

        debug(`Source de l'ajout : Non reconnue`)
        return false
    }

    /**
     * @private
     * Create a new Jukebox item
     * @param {String} track Track to create the item from
     * @param {Symbol} source Source of the track
     * @param {Discord/Member} asker Who's asking for it
     * @returns {JukeboxItem}
     */
    _createNewItem(track, source, asker) {
        switch (source) {
            case this._supportedSources.YOUTUBE:
                return new JukeboxYoutubeItem(track.match(this._regYoutube)[1], this.voiceConnection, asker);
                break;
            case this._supportedSources.LOCAL:
                return new JukeboxLocalItem(track, this.voiceConnection, asker);
                break;
            case this._supportedSources.SPOTIFY:
                break;
            case this._supportedSources.FANBURST:
                break;
        }
    }
}

module.exports = Jukebox;