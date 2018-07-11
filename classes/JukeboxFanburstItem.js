const JukeboxItem = require('./JukeboxItem');
const request = require("request-promise");
const {createReadStream} = require("fs");
const debug = require('debug')('jukeboxFanburstItem')


/**
 * @class
 * @extends JukeboxItem
 */
class JukeboxFanburstItem extends JukeboxItem {

    constructor(track, voiceConnection, asker) {
        super(track, voiceConnection, asker);

        /**
         * @private
         * @member {String} _trackId Fanburst Track id
         * @desc Fanburst track identifier
         */
        this._trackId = track.match(/https:\/\/api\.fanburst\.com\/tracks\/(.+)\/.*/)[1];

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
     * @static
     * @private
     * @returns {Function} All fanburst API endpoints
     */
    static _getFanburstAPIEndpoints(){
        return new(function () {
            this.root = 'https://api.fanburst.com';
            this.me = () => `${this.root}/me/`; // Logged user infos
            this.user = (id = '') => `${this.root}/users/${id}`; //User designated by id infos
            this.userPublicTracks = (id = '') => `${this.root}/users/${id}/tracks`; //User tracks list 
            this.userFavoriteTracks = (id = '') => `${this.root}/users/${id}/favorites`; //self explanatory
            this.searchUsers = (query = '') => `${this.root}/users/search?query=${query}`; //search for specifics users
            this.track = (id = '') => `${this.root}/tracks/${id}`; //search for specifics tracks
            this.streamTrack = (id = '') => `${this.root}/tracks/${id}/stream`; //search for specifics tracks
            this.uploadTrack = (title, description, isDownloadable = true, isPrivate = true) => {
                return `${this.root}/tracks/?title=${title}&description=${description}&downloadable=${isDownloadable}&private=${isPrivate}`; //search for specifics tracks
            }
            this.searchTracks = (query) => `${this.root}/tracks/search?query=${query}`;
        })();
    }

    /**
     * @static
     * @private
     * @returns {Object} Fanburst request template
     */
    static _getRequestTemplate(){
        return {
            url: undefined,
            headers: {
                'Accept-Version': 'v1'
            },
            method: 'GET',
            qs: {
                client_id: global.Config.API.Fanburst.client.id,
                access_token: global.Config.API.Fanburst.auth.access_token
            },
            json: true,
        }

    }

    /**
     * @override 
     * @public
     * Play the source
     */
    play(options) {
        super.play();
        const requestOpt = Object.assign(JukeboxFanburstItem._getRequestTemplate(), {
            url: JukeboxFanburstItem._getFanburstAPIEndpoints().streamTrack(this._trackId)
        })
        
        this._dispatcher = this._voiceConnection.playStream(
            request(requestOpt),
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
     * @static
     * @override
     * @public
     * Search for item to playback
     * @param {String} query What to search for
     * @param {Discord/VoiceConnection} voiceConnection voicechannel to play into
     * @param {Discord/Member} asker 
     * @param {Integer} [MAX_RESULTS=3]
     * @return {JukeboxItem[MAX_RESULTS]}
     */
    static async search(query, voiceConnection, asker, MAX_RESULTS = 3) {
        //Prepare request
        const requestOpt = Object.assign(JukeboxFanburstItem._getRequestTemplate(), {
            url : JukeboxFanburstItem._getFanburstAPIEndpoints().searchTracks(query)
        })
        let results = await request(requestOpt).catch( (err) => {
            console.error(err);
            return null;
        });

        if(!results){
            return null;
        }

        debug(results)
        //Trim results
        if(results.length > MAX_RESULTS){
            results = results.slice(0, MAX_RESULTS);
        }

        results = results.map( result => {
            return new JukeboxFanburstItem(result.stream_url, voiceConnection, asker);
        });

        return results;

    }

    /**
     * @async
     * @private
     * Retrieve the video infos from Fanburst and reduce it to what we need.
     * @param {function} resolve Resolve deferred @see{@link infos} promise
     * @param {function} reject Resolve deferred @see{@link infos} promise
     */
    async _retrieveInfo(resolve, reject) {
        const requestOpt = Object.assign(JukeboxFanburstItem._getRequestTemplate(), {
            url: JukeboxFanburstItem._getFanburstAPIEndpoints().track(this._trackId)
        })
        let data = await request(requestOpt).catch(reject);

        resolve({
            title: data.title,
            author: data.user.name,
            description: `Publiée le ${data.published_at}`,
            image: data.image_url,
            url: this.track
        });

    }

    /**
     * @private
     * @override
     * @returns Info about the playback
     */
    async _getInfo() {
        return await this.infos;
    }

}

module.exports = JukeboxFanburstItem;