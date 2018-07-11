const JukeboxItem = require('./JukeboxItem');
const request = require("request-promise");
const debug = require('debug')('JukeboxOpeningmoeItem')
const { join } = require("path");
const {save} = require(join(global.baseAppDir, 'utils', 'saveConfig.js'));
const fuzzySet = require("fuzzyset.js")
/**
 * @class
 * @extends JukeboxItem
 */
class JukeboxOpeningmoeItem extends JukeboxItem {

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
     * @static
     * @private
     * @returns {Function} All opening.moe API endpoints
     */
    static _getOpeningmoeEndpoints() {
        return new(function () {
            this.root = 'https://openings.moe';
            this.list = () => `${this.root}/api/list.php`; //List of all animes openings
            this.listFilenames = () => `${this.root}/api/list.php?filenames`; //List of all animes openings with only filenames
            this.listShuffled = () => `${this.root}/api/list.php?shuffle`; //List of all animes shuffled at random
            this.listShuffled = (filename) => `${this.root}/api/list.php?first=${filename}`; //List of all animes shuffled at random
            this.streamTrack = (id = '') => `${this.root}/video/${id}`; //Stream by track id
            this.track = (id = '') => `${this.root}/api/details.php?file=${id}`; //Info about track
        })();
    }

    /**
     * @static
     * @private
     * @returns {Object} Fanburst request template
     */
    static _getRequestTemplate() {
        return {
            url: undefined,
            headers: {
                'Accept-Version': 'v1'
            },
            method: 'GET',
            json: true,
        }

    }

    /**
     * @private
     * @async
     * @static
     * Update the anime list
     */
    static async _updateOpeningList(){
        const requestOpt = Object.assign(JukeboxOpeningmoeItem._getRequestTemplate(), {
            url: JukeboxOpeningmoeItem._getOpeningmoeEndpoints().listFilenames()
        })
        let results = await request(requestOpt).catch((err) => {
            console.error(err);
            return null;
        });
        if(!results || !results.length){
            return null;
        }
        JukeboxOpeningmoeItem._openingList = fuzzySet(results);
    }

    /**
     * @static
     * @async
     * get the opening list, updating it if needed
     * @returns {FuzzySet<String>} anime list
     */
    static get openingList(){
        if (!JukeboxOpeningmoeItem._openingList ||
            JukeboxOpeningmoeItem.openingListUpdateDate - Date.now() > JukeboxOpeningmoeItem.expiration) {
                debug("Update de la liste d'anime")
                return JukeboxOpeningmoeItem._updateOpeningList().then(() => {
                    return JukeboxOpeningmoeItem._openingList
                })
        }else{
            debug("Pas d'update Liste anime")
            return JukeboxOpeningmoeItem._openingList
        }
        

    }

    /**
     * @override 
     * @public
     * Play the source
     */
    play(options) {
        super.play();
        
        this._dispatcher = this._voiceConnection.playStream(
            JukeboxOpeningmoeItem._getOpeningmoeEndpoints().streamTrack(this.track),
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

        let results = (await JukeboxOpeningmoeItem.openingList).get(query, null, 0.08);

        if (!results || !results.length) {
            return null;
        }
        if (results.length > MAX_RESULTS) {
            results = results.slice(0, MAX_RESULTS);
        }
        return results.map(result => {
            return new JukeboxOpeningmoeItem(result[1], voiceConnection, asker);
        })
    }

    /**
     * @async
     * @private
     * Retrieve the video infos from Fanburst and reduce it to what we need.
     * @param {function} resolve Resolve deferred @see{@link infos} promise
     * @param {function} reject Resolve deferred @see{@link infos} promise
     */
    async _retrieveInfo(resolve, reject) {
        const requestOpt = Object.assign(JukeboxOpeningmoeItem._getRequestTemplate(), {
            url: JukeboxOpeningmoeItem._getOpeningmoeEndpoints().track(this.track)
        })
        let data = await request(requestOpt).catch(reject);

        resolve({
            title: `${data.source} - ${data.title}`,
            author: (data.song) ? `${data.song.artist} - ${data.song.title}` : 'inconnu',
            description: `Weeb`,
            image: "https://i.pinimg.com/736x/95/6a/72/956a72e128f787f1c7af24b33b485e81--rwby-rose-rwby-fanart.jpg",
            url: JukeboxOpeningmoeItem._getOpeningmoeEndpoints().streamTrack(this.track)
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
/**
 * @member {FuzzySet<String>} openingList List of anime opening to search on
 * @static
 * @private
 * 
 */
JukeboxOpeningmoeItem._openingList = null;
/**
 * @member {Date} openingListUpdateDate When has the list been updated
 * @static
 * @public
 */
JukeboxOpeningmoeItem.openingListUpdateDate = Date.now();
/**
 * @member {Integer} expiration Expiration date of the anime list
 * @static
 * @description 1 day means refresh the whole list after 1 day of usage 
 * @public
 */
JukeboxOpeningmoeItem.expiration = 1 * 24 * 3600 * 1000; //1 day

module.exports = JukeboxOpeningmoeItem;