const EventEmitter = require('events');
const debug = require('debug')('guiYoutubeItem');
const ytdl = require('ytdl-core');
const GuiItem = require("./GuiItem");
const {createReadStream} = require("fs");

/**
 * @class
 * @extends GuiItem
 */
class GuiYoutubeItem extends GuiItem {

    constructor(link) {
        super(link);
        this.createStream();
    }

    /**
     * Returns a readable stream that can be played right away
     * @returns {ReadableStream}
     */
    createStream() {
        this.stream = ytdl(this.track, {
            filter: 'audio',
            //highWaterMark: 1024 * 1024 * 50 //Give the song a 50Mb buffer size (default : 16kb)
        });


        //this.stream = createReadStream("f.wav");
    }


}

module.exports = GuiYoutubeItem;