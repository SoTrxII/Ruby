import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IJukebox } from "../@types/jukebox";
import { JukeboxState } from "../services/jukebox";

@injectable()
export class Resume implements ICommand {
  public readonly TRIGGER = "resume";

  constructor(@inject(TYPES.JUKEBOX) private jukebox: IJukebox) {}

  public readonly SCHEMA: ApplicationCommandData = {
    name: "resume",
    description: "resume playback",
  };

  async run(context: IContext): Promise<void> {
    let reply = "";
    if (this.jukebox.state !== JukeboxState.PAUSED)
      reply = "Playback is not paused";
    else {
      this.jukebox.resume();
      reply = "Playback resumed";
    }
    await context.reply(reply);
  }
}
