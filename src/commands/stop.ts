import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IJukebox } from "../@types/jukebox";
import { JukeboxState } from "../services/jukebox";

@injectable()
export class Stop implements ICommand {
  public readonly TRIGGER = "stop";

  constructor(@inject(TYPES.JUKEBOX) private jukebox: IJukebox) {}

  public readonly SCHEMA: ApplicationCommandData = {
    name: "stop",
    description: "Stop the playback",
  };

  async run(context: IContext): Promise<void> {
    let reply = "";
    if (this.jukebox.state !== JukeboxState.PLAYING)
      reply = "Nothing is currently playing !";
    else {
      await this.jukebox.stop();
      reply = "Playback stopped ! Leaving soon";
    }
    await context.reply(reply);
  }
}
