import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IJukebox } from "../@types/jukebox";
import { JukeboxState } from "../services/jukebox";

@injectable()
export class Skip implements ICommand {
  public readonly TRIGGER = "skip";

  constructor(@inject(TYPES.JUKEBOX) private jukebox: IJukebox) {}

  public readonly SCHEMA: ApplicationCommandData = {
    name: "skip",
    description: "Skip to the next song in the queue",
  };

  async run(context: IContext): Promise<void> {
    const vc = await context.getAuthorVoiceChannel();
    if (!vc) {
      await context.reply(`You must be in a voice channel !`);
      return;
    }
    this.jukebox.skip(vc);
    await context.reply("Song skipped !");
  }
}
