import { GuiItem } from "./gui-item";
import { GuiYoutubeItem } from "./gui-youtube-item";

export class GuiItemFactory {
  private static YOUTUBE = /^(.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*)/;
  static createItem(link): GuiItem {
    if (GuiItemFactory.YOUTUBE.test(link)) {
      return new GuiYoutubeItem(link);
    }

    return undefined;
  }
}
