import { GuildMember, VoiceConnection } from "discord.js";
import { JukeboxItem } from "./jukebox-item";
import { JukeboxYoutubeItem } from "./jukebox-youtube-item";
import { SearchService } from "../Search/search-service";
import { TYPES } from "../../types";
import container from "../../inversify.config";

export class JukeboxItemFactory {
  private static YOUTUBE = /^(http(s)?:\/\/)?((w){3}.)?(music\.)?(m\.)?youtu(be|.be)?(\.com)?\/(?!channel).+/;
  private static disableTextSearch = false;

  /**
   * Search for video providers using service locator Pattern
   */
  private static get searchServices(): SearchService {
    return container.get<SearchService>(TYPES.SearchServices);
  }

  static async createItem(
    link: string,
    voiceConnection: VoiceConnection,
    asker: GuildMember
  ): Promise<JukeboxItem> {
    const item = JukeboxItemFactory.getFromLink(link, voiceConnection, asker);
    if (JukeboxItemFactory.disableTextSearch || item !== undefined) return item;
    const newLink = await JukeboxItemFactory.searchForMatch(link);
    return JukeboxItemFactory.getFromLink(newLink, voiceConnection, asker);
  }

  static setTextSearchEnabled(state: boolean): void {
    JukeboxItemFactory.disableTextSearch = !state;
  }

  private static getFromLink(
    link: string,
    voiceConnection: VoiceConnection,
    asker: GuildMember
  ): JukeboxItem {
    if (JukeboxItemFactory.YOUTUBE.test(link)) {
      return new JukeboxYoutubeItem(link, voiceConnection, asker);
    }
    return undefined;
  }

  private static async searchForMatch(link: string): Promise<string> {
    return await JukeboxItemFactory.searchServices.getFirst(link);
  }
}
