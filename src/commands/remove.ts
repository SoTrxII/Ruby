import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IJukebox } from "../@types/jukebox";
import { JukeboxState } from "../services/jukebox";
import { SongProgressUi } from "../services/song-progress-ui";

@injectable()
export class Remove implements ICommand {
  public readonly TRIGGER = "remove";

  constructor(@inject(TYPES.JUKEBOX) private jukebox: IJukebox) {}

  public readonly SCHEMA: ApplicationCommandData = {
    name: "remove",
    description: "Remove a song from the playlist by its index",
    options: [
      {
        name: "index",
        type: "INTEGER",
        description: "index of the song to remove",
      },
    ],
  };

  async run(context: IContext): Promise<void> {
    let reply = "";
    const args = context.getArgs(this.SCHEMA.options);
    try {
      const index = Number(args.get("index").value);
      if (isNaN(index)) throw new Error();
      this.jukebox.remove(index);
      reply = "Song Removed !";
      await context.reply(reply);
      await context.reply(await this.jukebox.getPrettyQueue());
    } catch (e) {
      reply = `Invalid index provided ${String(args.get("index").value)}`;
      await context.reply(reply);
    }
  }
}
