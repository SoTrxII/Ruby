// eslint-disable-next-line @typescript-eslint/camelcase
import { google, youtube_v3 } from "googleapis";
import { GaxiosResponse } from "gaxios";
import { injectable } from "inversify";
// eslint-disable-next-line @typescript-eslint/camelcase
import Youtube = youtube_v3.Youtube;
// eslint-disable-next-line @typescript-eslint/camelcase
import Schema$SearchListResponse = youtube_v3.Schema$SearchListResponse;
// eslint-disable-next-line @typescript-eslint/camelcase
import Schema$SearchResult = youtube_v3.Schema$SearchResult;
import { SearchAPI } from "../@types/search-API";
import {memoize} from "../decorators/memoize";

@injectable()
export class YoutubeSearchService implements SearchAPI {
  private yt: Youtube;
  private static LINK_REGEX = /^(http(s)?:\/\/)?((w){3}.)?(music\.)?(m\.)?youtu(be|.be)?(\.com)?\/(?!channel).+/;

  constructor(token: string) {
    this.yt = google.youtube({
      version: "v3",
      auth: token
    });
  }

  isProperLink(url: string): boolean {
    return YoutubeSearchService.LINK_REGEX.test(url);
  }
  private static getUrlFromId(id: string): string {
    return `https://www.youtube.com/watch?v=${id}`;
  }

  @memoize(100)
  async searchFirstURL(query: string): Promise<string> {
    let videos = undefined;
    try {
      videos = await this.search(query);
    } catch (e) {
      console.error(e);
    }
    if (!videos || videos.length === 0) {
      return undefined;
    }
    return YoutubeSearchService.getUrlFromId(videos[0].id.videoId);
  }

  async search(
    query: string,
    maxResults = 1
  ): Promise<Array<Schema$SearchResult>> {
    const res = (await this.yt.search.list({
      part: ["snippet"],
      q: query,
      maxResults: maxResults,
      type: ["video"]
    })) as GaxiosResponse<Schema$SearchListResponse>;
    if (!res || res.data.items.length === 0) {
      return undefined;
    }
    return res.data.items;
  }
}
