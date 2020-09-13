import { CommandoClient } from "discord.js-commando";
import { JukeboxItemDetails } from "./jukebox-item-API";

export interface SongProgressManagerAPI {
  start(
    client: CommandoClient,
    song: JukeboxItemDetails,
    interval: number
  ): void;
  stop(): void;
}
