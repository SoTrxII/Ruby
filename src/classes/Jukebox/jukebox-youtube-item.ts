import * as ytdl from "ytdl-core";
import { JukeboxItem, JukeboxItemInfos } from "./jukebox-item";

export class JukeboxYoutubeItem extends JukeboxItem {
  infos: Promise<JukeboxItemInfos>;

  constructor(track, voiceConnection, asker) {
    super(track, voiceConnection, asker);
    // Deferred promise
    // tslint:disable-next-line:one-variable-per-declaration
    let resolve = undefined,
      reject = undefined;
    /**
     * Uses a deferred promise that resolve when the informations are fetched
     */
    // We actually need the function() for arguments to be defined
    // tslint:disable-next-line:only-arrow-functions
    this.infos = new Promise(function(): void {
      // eslint-disable-next-line prefer-rest-params
      [resolve, reject] = arguments;
    });
    this._retrieveInfo(resolve, reject).catch(console.error);
  }

  /**
   * @summary Play the source
   */
  play(options): void {
    super.play(options);
    this.dispatcher = this.voiceConnection.playStream(
      ytdl(this.track, {
        quality: "highest",
        highWaterMark: 1024 * 1024 * 50 // Give the song a 50Mb buffer size (default : 16kb)
      }),
      options
    );
    this.dispatcher.on("end", () => {
      /**
       * Emitted when an item stops playing
       * @event JukeboxItem#end
       */
      this.emit("end");
    });
  }

  /**
   * @returns Info about the playback
   */
  async _getInfo(): Promise<JukeboxItemInfos> {
    return this.infos;
  }

  /**
   * @async
   * @summary Retrieve the video infos from Youtube and reduce it to what we need.
   * @param  resolve Resolve deferred @see{@link infos} promise
   * @param  reject Resolve deferred @see{@link infos} promise
   */
  private async _retrieveInfo(resolve, reject): Promise<void> {
    const data = await ytdl.getInfo(this.track).catch(reject);

    resolve({
      duration: parseInt(data.length_seconds),
      title: data.title,
      author: data.author.name,
      description: data.description,
      image: `https://img.youtube.com/vi/${data.video_id}/0.jpg`,
      url: this.track
    });
  }
}
