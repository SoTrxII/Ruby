import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IJukebox } from "../@types/jukebox";
import { JukeboxState } from "../services/jukebox";

@injectable()
export class Pause implements ICommand {
  public readonly TRIGGER = "pause";

  constructor(@inject(TYPES.JUKEBOX) private jukebox: IJukebox) {}

  public readonly SCHEMA: ApplicationCommandData = {
    name: "pause",
    description: "Pause playback",
  };

  async run(context: IContext): Promise<void> {
    let reply = "";
    if (this.jukebox.state !== JukeboxState.PLAYING)
      reply = "No playback to be paused !";
    else {
      this.jukebox.pause();
      reply = "Playback paused !";
    }
    await context.reply(reply);
  }
}
