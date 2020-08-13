import { JukeboxItemAPI, JukeboxItemDetails } from "../@types/jukebox-item-API";
import { StreamDispatcher, VoiceConnection } from "discord.js";
import { DownloadAPI } from "../@types/youtube-downloader-API";
import { injectable } from "inversify";
import { YoutubeDownloadService } from "../services/youtube-download-service";

@injectable()
export class JukeboxYoutubeItem implements JukeboxItemAPI {
  //Can't IoC this one
  private downloader: DownloadAPI = new YoutubeDownloadService();

  public isLooping = false;

  constructor(public readonly url: string) {}

  async play(vc: VoiceConnection): Promise<StreamDispatcher> {
    return vc.play(await this.downloader.download(this.url), { type: "opus" });
  }

  async getDetails(): Promise<JukeboxItemDetails> {
    let data;
    try {
      data = await this.downloader.getInfo(this.url);
    } catch (e) {
      console.error(`Couldn't retrieve infos for link ${this.url}`);
      console.error(e);
    }
    const details = data?.videoDetails;
    return {
      duration: parseInt(details?.lengthSeconds),
      title: details?.title,
      author: details?.author.name,
      description: details?.shortDescription,
      image: `https://img.youtube.com/vi/${details?.videoId}/0.jpg`,
      url: this.url
    };
  }
}
