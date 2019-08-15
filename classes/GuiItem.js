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
        this.islooping = false;
        this.startTime = 0;
        //Set by mute function, backup volume to restore after mute
        this.volumeBackup = undefined;
    }

    get state() {
        return this._state;
    }

    set state(state) {
        if (GuiItem.STATE.hasOwnProperty(state)) {
            throw new Error(state + "is not a valid song state !")
        }
        this._state = state;

    }

    get volume() {
        return this.volumeStream.volume;
    }

    set volume(volume) {
        const vol = parseInt(volume);

        if (isNaN(vol) || vol < 0 || vol > 100) {
            throw new Error(volume + " is not a valid volume !");
        }
        console.log(vol);
        this.volumeStream.setVolume(vol / 100);
    }

    /**
     * Returns a readable stream that can be played right away
     * @returns {ReadableStream}
     */
    createStream() {
        throw new Error("abtract method");
    }

    mute() {
        if (this.volumeBackup !== undefined) {
            return false;
        }
        this.volumeBackup = this.volume;
        this.volume = 0;
    }

    unmute() {
        if (this.volumeBackup === undefined) {
            return false;
        }
        this.volume = this.volumeBackup * 100;
        this.volumeBackup = undefined;
    }


}

GuiItem.STATE = Object.freeze({
    STOPPED: "stopped",
    PLAYING: "playing",
    PAUSED: "paused",
});


module.exports = GuiItem;