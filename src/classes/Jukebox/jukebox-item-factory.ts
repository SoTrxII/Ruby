import { GuildMember, VoiceConnection } from "discord.js";
import { JukeboxItem } from "./jukebox-item";
import { JukeboxYoutubeItem } from "./jukebox-youtube-item";

export class JukeboxItemFactory {
  private static YOUTUBE = /^(http(s)?:\/\/)?((w){3}.)?(music\.)?(m\.)?youtu(be|.be)?(\.com)?\/(?!channel).+/;
  static createItem(
    link: string,
    voiceConnection: VoiceConnection,
    asker: GuildMember
  ): JukeboxItem {
    if (JukeboxItemFactory.YOUTUBE.test(link)) {
      return new JukeboxYoutubeItem(link, voiceConnection, asker);
    }

    return undefined;
  }
}
