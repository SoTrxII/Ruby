const EventEmitter = require('events');
const Promise = require('bluebird');
const JukeboxItem = require('./JukeboxItem');
const JukeboxYoutubeItem = require('./JukeboxYoutubeItem');
const JukeboxFanburstItem = require('./JukeboxFanburstItem');
const JukeboxLocalItem = require('./JukeboxLocalItem');
const JukeboxOpeningmoeItem = require('./JukeboxOpeningmoeItem');
const {chooseOneItem} = require('../utils/userInteraction.js');
const debug = require('debug')('jukebox');

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
         * @member {JukeboxItem[]} _playQueue List of music to be played
         */
        this._playQueue = [];

        /**
         * @private
         * @member {Object} _supportedSources Enum of valid sources to play
         */
        this._supportedSources = Object.freeze({
            YOUTUBE: Symbol("youtube"),
            OPENINGMOE: Symbol("opening.moe"),
            FANBURST: Symbol("fanburst"),
            LOCAL: Symbol("local")
        });

        /**
         * @public
         * @member {Object} _supportedSources Enum of valid sources to play
         */
        this.blindTestCategories = Object.freeze({
            ANIME: Symbol("anime"),
            FILM: Symbol("film"),
            TRENDING: Symbol("trending"),
            CARTOON: Symbol("cartoon")
        });

        /**
         * @public
         * @member isPlaying Is the Jukebox playing right now ?
         */
        this.isPlaying = false;

        /**
         * @public
         * @member isBlindTest Is the broadcast a blind test ?
         */
        this.isBlindTest = false;

        /**
         * @public
         * @member volume playback volume
         */
        this.volume = 40;

        /**
         * @private
         * @member _regYoutube Regex to recognize youtube links
         */
        this._regYoutube = /^(.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*)/;

        /**
         * @private
         * @member _regFanburst Regex to recognize fanburst links
         */
        this._regFanburst = /^https:\/\/api\.fanburst\.com\/tracks\/.+\/stream$/;

        /**
         * @private
         * @member _regOpeningmoe Regex to recognize opening.moe links
         */
        this._regOpeningmoe = /^https:\/\/openings\.moe\/\?video=.*$/;

    }

    /**
     * @summary Change the vocie connection to stream into
     * @param {Discord/VoiceConnection} vc new voice connections
     */
    set voiceConnection(vc){
        this._voiceConnection = vc;

        //Also update every item in the playlist
        //as they were constructed with the old voice connection 
        this._playQueue.forEach(item => {
            item.voiceConnection = vc;
        });
    }
    /**
     * @public
     * @param {String} track Source track to add to the playlist
     * @param {Discord/Member} asker Who's aking to add it
     * @returns {Boolean} True if the track was added
     */
    addMusic(track, asker) {

        //You can't add music during a blind test, as it s BLIND
        if(this.isBlindTest){
            this.textChannel.send("Ajouter des musiques à un BLIND test ? Vraiment ?")
            return false;
        }

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
     * @summary Begin playing the songs in the queue
     * @param {Boolean} [displaySong=true] Send details about the song in the text channel before playing
     * @param {Integer} [stopAfter=-1] If positive stops the song after a ceratin time (seconds)
     * @returns false if could not play
     * @fires Jukebox#QueueEmpty
     * @listens JukeboxItem#end for relooping
     */
    play(displaySong=true, stopAfter=-1) {

        if (this.isPlaying) {
            throw new Error("The jukebox is already playing !")
        }

        if (!this._nextSong()) {
            /**
             * Emitted when there are no more songs to play.
             * @event Jukebox#QueueEmpty
             */
            this.emit("QueueEmpty");
            return false;
        }

        this.isPlaying = true;

        debug(this.currentSong);

        if (displaySong){
            //Send details about the song (async,
            //as we don't really need to wait for it to resolve)
            this.currentSong.toEmbed().then(async (embed) => {
                await this.textChannel.send("Chanson en cours : ")
                this.textChannel.send({
                    embed
                });
            })
            this.currentSong.toString().then( async (str) => {
                this.voiceConnection.client.user.setActivity(songName, {
                    type: 'STREAMING'
                });
            });

        }

        this.currentSong.play({
            volume: this.volume / 100,
            passes : 2
        });
        let timeout;
        if(stopAfter !== -1){
            timeout = setTimeout(() => {
                this.fadeOutStop(2500);
            }, stopAfter * 1000)
        }
        //Loop after song
        this.currentSong.on('end', () => {
            //If the event triggers before the timeout, clear it
            if(timeout){
                clearTimeout(timeout);
            }
            if(this.isBlindTest){
                this.currentSong.toEmbed().then(async (embed) => {
                    await this.textChannel.send("La chanson était : ")
                    this.textChannel.send({
                        embed
                    });
                });
            }      
            this.onEnd(displaySong, stopAfter)
        });
        //setTimeout( () => this.currentSong.on('end', (evt) => this.onEnd(evt), 5000));
        return true;
    }

    /**
     * Event handler for @see{@link{JukeboxItem#end}}
     * @summary What to do at the end of a track
     */
    async onEnd(displaySong, stopAfter) {
        debug("END")
        this.currentSong.off('end', this.onEnd);
        //this.currentSong.stop();
        //await new Promise( (res, rej) => setTimeout( res(), 5000));
        this.isPlaying = false;
        this.play(displaySong, stopAfter);
    }

    /**
     * @async
     * @public 
     * @summary Display the playing queue into the discord channel
     */
    async displayQueue() {

        if(this.isBlindTest){
            this.textChannel.send("Non");
            return;
        }

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
     * @summary Change playback volume
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
     * @summary Skip current song and go to the next one
     * @returns False if there is no next song
     */
    skip() {
        if(this.isBlindTest){
            this.textChannel.send("Pas de skip durant un blind test !");
            return false;
        }

        this.currentSong.stop()
        return true;
    }

    /**
     * @public
     * @summary Jump to n-th element in the queue
     * @param {Integer} songIndex 
     * @throws If index is not valid
     * 
     */
    skipTo(songIndex) {

        if(this.isBlindTest){
            this.textChannel.send("Pas de skip durant un blind test !");
            return;
        }

        if (songIndex < 0 || this._playQueue.lenght < songIndex + 1) {
            throw new Error("Invalid song index");
        }
        debug(songIndex)

        //Skip songs, skipTo(0) should be an alias to skip()
        if (songIndex > 0) {
            this._playQueue.splice(0, songIndex)
        }
        this.currentSong.stop();
    }
    /**
     * @public
     * @summary Stop current song playback
     * @param {Boolean} [startNext=true] Wether to start the next song in the list
     * @returns True if stopped
     */
    stop(startNext=true) {
        if(!startNext){
            this.currentSong.removeAllListeners('end');
        }
        let hasWorked = this.currentSong.stop()
        if (hasWorked) {
            this.isPlaying = false;
        }
        return hasWorked;
    }

    async fadeOutStop(fadeTime, startNext=true) {

        let numberofStep = 5;
        let fadeStep = fadeTime / numberofStep;
        for (let i = numberofStep; i > 0; i--) {
            this.currentSong.setLogVolume(0.5)
            await (new Promise((res, rej) => setTimeout(res()), fadeStep));
        }

        this.stop(startNext);

    }

    /**
     * @public
     * @summary Check if the jukebox is paused
     * @returns {Boolean}
     */
    isPaused() {
        return this.currentSong && this.currentSong.isPaused;
    }

    /**
     * @public
     * @summary Pause the playback
     * @returns false if could not pause the playback
     */
    pause() {
        if (this.currentSong.pause()) {
            return true;
        }
        return false;

    }
    /**
     * @private
     * @param {Integer} max Upper limit
     */
    _getRandomInt(max) {
        return Math.floor(Math.random() * Math.floor(max));
    }

    async blindTest(number, categories){

        //Cats : anime, film, dessin-animé, chanson populaires

        //Categories to choose from for each song
        const allowedCategories = Object.getOwnPropertySymbols(categories);
        debug(allowedCategories)
        let blindTestPlaylist = Array(number).fill(0);
        //Fill the blindtest playlist in parallel
        blindTestPlaylist = blindTestPlaylist.map(() => {
            const chosenCategory = allowedCategories[this._getRandomInt(allowedCategories.length)];
            debug(`chosenCategory : ${chosenCategory.toString()}`)
            switch (chosenCategory) {
                case this.blindTestCategories.ANIME:
                    debug("Category : ANIME")
                    return JukeboxOpeningmoeItem.getRandom(categories[chosenCategory],
                         this._voiceConnection,
                         this._voiceConnection.client.user);
                    break;
                case this.blindTestCategories.TRENDING:
                    debug("Category : TRENDING");
                    break;
                default:
                    break;
            }
        });
        // Wait for all to be resolved
        blindTestPlaylist = await Promise.all(blindTestPlaylist);
        blindTestPlaylist.map(song => {
            debug(song.track)
        })

        //debug(blindTestPlaylist);

        this.isBlindTest = true;
        this._playQueue = blindTestPlaylist;
        this.play(false, 30);
        
    }

    /**
     * @public
     * @summary Resume the playback
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
     * @public
     * @summary Search on the known sources
     for musics corresponding to the search query
     * @param {String} query What to search for
     * @param {Discord/Message} evt Message leadind to the search
     */
    async search(query, evt){
        let returnString = "Recherche en cours...\n";
        let displayedResults = await this.textChannel.send(returnString);
        //Do all the search in parallel
        let searchPromises = [];
        searchPromises.push(JukeboxYoutubeItem.search(query, this._voiceConnection, evt.author));
        searchPromises.push(JukeboxOpeningmoeItem.search(query, this._voiceConnection, evt.author));
        searchPromises.push(JukeboxLocalItem.search(query, this._voiceConnection, evt.author));
        searchPromises.push(JukeboxFanburstItem.search(query, this._voiceConnection, evt.author, 6));

        //Flag : True if there is at least one result to the query
        let hasResults = false;
        let resultIndex = 0;
        //Results from all sources
        let globalResults = [];
        Promise.reduce( searchPromises, async (returnString, results) => {
            //Called as soon as one promise resolves
           
            //Check number of results
            if (!results || !results.length) {
                return returnString;
            }
            hasResults = true;

            globalResults = globalResults.concat(results);

            //Display
            let resultsStrings = await Promise.all(
                results.map(result => result.toString())
            );
            let separator = '';
            switch (results[0].constructor.name) {
                case "JukeboxYoutubeItem":
                    separator = "\n\`\`\`prolog\n YOUTUBE\n\`\`\`\n\t\t"
                    break;
                case "JukeboxLocalItem":
                    separator = "\n\`\`\`yaml\n LOCAL\n\`\`\`\n\t\t"
                    break;
                case "JukeboxFanburstItem":
                    separator = "\n\`\`\`fix\n FANBURST\n\`\`\`\n\t\t"
                    break;
                case "JukeboxOpeningmoeItem":
                    separator = "\n\`\`\`css\n OPENING MOE\n\`\`\`\n\t\t"
                    break;
                default:
                    separator = "--------------\n\t\t"
            }
            returnString += separator;
            returnString += resultsStrings.map(resultString => {
                return `${++resultIndex}) ${resultString}\n\t\t`
            }).join('');
            
            displayedResults.edit(returnString);
            return returnString;
        }, returnString)
        .then( async (returnString) => {
            //Called when all the promises are resolved
            returnString = returnString.replace("Recherche en cours...", "Recherche terminée !")
            //Stop there as there is no results
            if (!hasResults){
                returnString += "Aucun résultats"
                displayedResults.edit(returnString);
                return;
            }
            displayedResults.edit(returnString);

            //Let the user choose the music to add to the list
            const chosenSong = await chooseOneItem(
                evt,
                globalResults,
                `Quelle musique ajouter à la liste de lecture ?`,
                {
                    displayChoices : false,
                    noItemResponse : "Aucun morceau à ajouter",
                    timeout : 2*60*1000 //2mins
                }
            );
            //If a choice was made, ad it to the play queue
            if(chosenSong){
                this._playQueue.push(chosenSong);
                evt.channel.send("Musique ajoutée à la liste !");
                this.displayQueue();
            }else{{
                evt.channel.send("Annulé!")
            }}
            
        })




    }

    /**
     * @private
     * @summary Take the next song in queue
     * @returns False if could not get next song
     */
    _nextSong() {
        debug(`Longueur de la file : ${this._playQueue.length}`);
        if (!this._playQueue.length) {

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
        else if (this._regFanburst.test(track)) {
            debug(`Source de l'ajout : Fanburst`)
            return this._supportedSources.FANBURST;
        }
        else if (this._regOpeningmoe.test(track)) {
            debug(`Source de l'ajout : Opening.moe`)
            return this._supportedSources.OPENINGMOE;
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
     * @summary Create a new Jukebox item
     * @param {String} track Track to create the item from
     * @param {Symbol} source Source of the track
     * @param {Discord/Member} asker Who's asking for it
     * @returns {JukeboxItem}
     */
    _createNewItem(track, source, asker) {
        switch (source) {
            case this._supportedSources.YOUTUBE:
                return new JukeboxYoutubeItem(track.match(this._regYoutube)[1], this._voiceConnection, asker);
                break;
            case this._supportedSources.LOCAL:
                return new JukeboxLocalItem(track, this._voiceConnection, asker);
                break;
            case this._supportedSources.OPENINGMOE:
                return new JukeboxOpeningmoeItem(track, this._voiceConnection, asker)
                break;
            case this._supportedSources.FANBURST:
                return new JukeboxFanburstItem(track, this._voiceConnection, asker);
                break;
            default :
                throw new Error("Unrecognized source");
        }
    }
}

module.exports = Jukebox;