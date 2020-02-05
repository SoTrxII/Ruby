import { Readable } from "stream";
import * as ytdl from "ytdl-core";
import { GuiItem } from "./gui-item";

export class GuiYoutubeItem extends GuiItem {
  constructor(link) {
    super(link);
    this.createStream();
  }

  /**
   * Returns a readable stream that can be played right away
   */
  createStream(): Readable {
    this.stream = ytdl(this.track, {
      filter: "audio"
    });

    return this.stream;
  }
}
