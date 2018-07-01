const EventEmitter = require('events');
const {
    RichEmbed
} = require('discord.js');
const debug = require('debug')('jukeboxItem')

/**
 * @class
 * @extends EventEmitter
 */
class JukeboxItem extends EventEmitter {

    constructor(track, voiceConnection, asker) {

        super();

        if (this === JukeboxItem) {
            throw new Error("Cannot construct an Abstract class");
        }

        if (!track || !voiceConnection || !asker) {
            throw new Error(`The track, the voice connection, and the asker are all required : 
            got track : ${track} 
            voiceConnection : ${voiceConnection}
            asker : ${asker}`);
        }
        /**
         * @public
         * @member {Discord/Member} asker Who's asking for the song to be played
         */
        this.asker = asker;

        /**
         * @public
         * @member {String} track Track to be played
         */
        this.track = track;

        /**
         * @private
         * @member {Discord/voiceConnection} voiceConnection Discord voice Connection
         */
        this._voiceConnection = voiceConnection;

        /**
         * @public
         * @member {Boolean} hasBegun Has the playback begun at some point ?
         */
        this.hasBegun = false;

        /**
         * @public
         * @member {Boolean} isPaused Is the playback paused ?
         */
        this.isPaused = false;

        /**
         * @private
         * @member {Discord/StreamDispatcher} _dispatcher Song playback dispatcher
         */
        this._dispatcher = null;
    }
    /**
     * @public
     * @abstract
     * Play the source
     */
    play(options) {
        if (this.constructor.name == 'JukeboxItem') {
            throw new Error("This method has to be implemented !")
        }
        this.hasBegun = true;
    }

    /**
     * @public
     * Resume the playback of the song if possible
     * @returns {Boolean} True if playback was resumed, false otherwise
     */
    resume() {
        if (this._dispatcher && this.hasBegun && this.isPaused) {
            this._dispatcher.resume();
            this.isPaused = false;
            return true
        }
        return false;
    }

    /**
     * @public
     * Pause the playback of the song if possible
     * @returns {Boolean} True if the playback was paused, false otherwise
     */
    pause() {
        debug(this.hasBegun)
        if (this._dispatcher && this.hasBegun && !this.isPaused) {
            this._dispatcher.pause();
            this.isPaused = true;
            return true;
        }
        return false;

    }

    /**
     * @public
     * Stops the playback of the song if possible
     * @returns {Boolean} True if the playback was stopped
     */
    stop() {
        if (this._dispatcher && this.hasBegun) {
            this._dispatcher.end();
            return true;
        }
        return false;
    }


    /**
     * @public
     * Change the playback volume
     * 
     */
    setVolume(volume) {
        this._dispatcher.setVolume(volume)
    }

    /**
     * @async
     * @private
     * @abstract
     * @summary Get playback informations
     * @description Try to get all possible infos about the current playback (such as author, length, title...)
     * @return {Object} data gathered
     */
    async _getInfo() {
        debug(this)
        throw new Error("This method has to be implemented !")
    }

    /**
     * @async
     * @public
     * return a string containing the minimum info about the track
     * @return {String}
     */
    async toString() {
        const data = await this._getInfo();
        return `${data.title} - ${data.author}`
    }

    /**
     * @async 
     * @public
     * return an embed corresponding to current playback
     * @returns {Discord/RichEmbed} embed
     */
    async toEmbed() {
        const data = await this._getInfo();
        const em = new RichEmbed();
        const DESC_LIMIT = 100

        //Song-dependant parameters
        em.setTitle(data.title || 'Inconnu');
        em.addField('Auteur', data.author || 'Inconnu')
        // 2048 -> desc limit in embed
        let description;
        if (data.description) {
            if (data.description.length > DESC_LIMIT - 1) {
                description = `${data.description.substring(0, DESC_LIMIT - 4 )}...`;
            } else {
                description = data.description;
            }
        }
        em.setDescription(description || 'Une grosse musique');
        em.setImage(data.image || '');
        em.setURL(data.url || '');

        //Item dependant parameters
        debug(this.constructor.name)
        switch (this.constructor.name) {
            case 'JukeboxYoutubeItem':
                em.setThumbnail("https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo_youtube_ios.jpg");
                em.setColor('#E62A21');
                break;
            case 'JukeboxSpotifyItem':
                em.setThumbnail("https://d29fhpw069ctt2.cloudfront.net/icon/image/38714/preview.svg");
                em.setColor('#1ED760');
                break;
            case 'JukeboxFanburstItem':
                em.setThumbnail("https://son.gg/wp-content/themes/songg/assets/img/fanburst-icon.png")
                em.setColor('#090909');
                break;
            default:
                break;
        }
        em.setAuthor(
            this.asker.username,
            this.asker.displayAvatarURL,
        );

        //Jukebox dependant parameters
        em.setFooter(`DJ Ruby ~~`, global.Rin.user.displayAvatarURL);
        em.setTimestamp();


        return em;
    }

}

module.exports = JukeboxItem;