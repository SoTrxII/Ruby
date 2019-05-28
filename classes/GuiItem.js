const EventEmitter = require('events');
const debug = require('debug')('guiItem');

/**
 * @class
 * @extends EventEmitter
 */
class GuiItem extends EventEmitter {

    constructor(link) {
        super();
        //The link is uncontrolled as the sole mean of instanciating it
        //is from the factory
        this.track = link;
        this.speaker = null;
        this.ffmpeg = null;
        this.volumeStream = null;
        this._state = GuiItem.STATE.STOPPED;


    }

    /**
     * Returns a readable stream that can be played right away
     * @returns {ReadableStream}
     */
    createStream() {
        throw new Error("abtract method");
    }

    set state(state){
        if(GuiItem.STATE.hasOwnProperty(state)){
            throw new Error(state + "is not a valid song state !")
        }
        this._state = state;
        
    }

    get state(){
        return this._state;
    }

    set volume(volume){
        const vol = parseInt(volume);
        if(isNaN(vol) || vol < 0 || vol > 100){
            throw new Error(volume + " is not a valid volume !");
        }
        this.volumeStream.setVolume(vol / 100);
    }

    get volume(){
        return this.volumeStream.getVolume();
    }



}
GuiItem.STATE = Object.freeze({
    STOPPED: "stopped",
    PLAYING: "playing",
    PAUSED: "paused",
});


module.exports = GuiItem;