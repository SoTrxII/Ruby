import { SearchService } from "./search-service";
// eslint-disable-next-line @typescript-eslint/camelcase
import { google, youtube_v3 } from "googleapis";
import { GlobalExt } from "../../@types/global";
import { GaxiosResponse } from "gaxios";
import { injectable } from "inversify";
import * as debug0 from "debug";
// eslint-disable-next-line @typescript-eslint/camelcase
import Youtube = youtube_v3.Youtube;
// eslint-disable-next-line @typescript-eslint/camelcase
import Schema$SearchListResponse = youtube_v3.Schema$SearchListResponse;
// eslint-disable-next-line @typescript-eslint/camelcase
import Schema$SearchResult = youtube_v3.Schema$SearchResult;

declare const global: GlobalExt;
const debug = debug0("Youtube-search");

@injectable()
export class YoutubeSearch extends SearchService {
  private yt: Youtube;

  constructor() {
    super();
    this.yt = YoutubeSearch.initializeYoutube();
  }

  private static initializeYoutube(): Youtube {
    return google.youtube({
      version: "v3",
      auth: global.Config.API.Google.youtubeParser
    });
  }

  private static getUrlFromId(id: string): string {
    return `https://www.youtube.com/watch?v=${id}`;
  }

  async getFirst(query: string): Promise<string> {
    let videos = undefined;
    try {
      videos = await this.searchVideos(query);
    } catch (e) {
      debug(e);
    }
    if (!videos || videos.length === 0) {
      return undefined;
    }
    return YoutubeSearch.getUrlFromId(videos[0].id.videoId);
  }

  private async searchVideos(
    query: string,
    maxResults = 1
  ): Promise<Array<Schema$SearchResult>> {
    const res = (await this.yt.search.list({
      part: "id",
      q: query,
      maxResults: maxResults,
      type: "video"
    })) as GaxiosResponse<Schema$SearchListResponse>;
    if (!res || res.data.items.length === 0) {
      return undefined;
    }
    return res.data.items;
  }
}
