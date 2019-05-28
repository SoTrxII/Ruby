const EventEmitter = require('events');
const debug = require('debug')('guiItemFactory');
const GuiYoutubeItem = require("./GuiYoutubeItem.js");

/**
 * @class
 * @extends EventEmitter
 */
class GuiItemFactory extends EventEmitter {

    constructor(link) {
        super();

    }

    static createItem(link){
        if (GuiItemFactory.YOUTUBE.test(link)){
            return new GuiYoutubeItem(link);
        }

        return null;

    }
}

GuiItemFactory.YOUTUBE = /^(.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*)/;


module.exports = GuiItemFactory;