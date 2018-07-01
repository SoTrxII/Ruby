const JukeboxItem = require('./JukeboxItem');
const ytdl = require('ytdl-core');
const debug = require('debug')('jukeboxYoutubeItem')

/**
 * @class
 * @extends JukeboxItem
 */
class JukeboxYoutubeItem extends JukeboxItem {

    constructor(track, voiceConnection, asker) {
        super(track, voiceConnection, asker);
        //Deferred promise
        let resolve, reject;
        /**
         * @public
         * @member {Promise<Object>} infos Infos about the video
         * @desc Uses a deferred promise that resolve when the informations are fetched 
         */
        this.infos = new Promise(function () {
            resolve = arguments[0];
            reject = arguments[1];
        });
        this._retrieveInfo(resolve, reject).catch(console.err);
    }

    /**
     * @public
     * Play the source
     */
    play(options) {
        super.play();
        this._dispatcher = this._voiceConnection.playStream(
            ytdl(this.track, {
                filter: 'audioonly',
                highWaterMark: 1024 * 1024 * 10 //Give the song a 10Mb buffer size (default : 16kb)
            }),
            options
        )
        this._dispatcher.on('end', (evt) => {
            /**
             * Emitted when an item stops playing
             * @event JukeboxItem#end
             */
            this.emit('end');
        })
    }

    /**
     * @async
     * Retrieve the video infos from Youtube and reduce it to what we need.
     * @param {function} resolve Resolve deferred @see{@link infos} promise
     * @param {function} reject Resolve deferred @see{@link infos} promise
     */
    async _retrieveInfo(resolve, reject) {
        const data = await ytdl.getInfo(this.track).catch(reject);

        resolve({
            title: data.title,
            author: data.author.name,
            description: data.description,
            image: `https://img.youtube.com/vi/${data.video_id}/0.jpg`,
            url: this.track
        });

    }

    /**
     * @returns Info about the playback
     */
    async _getInfo() {
        return await this.infos;
    }

}

module.exports = JukeboxYoutubeItem;