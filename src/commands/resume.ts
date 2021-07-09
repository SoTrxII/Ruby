import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IJukebox } from "../@types/jukebox";
import { JukeboxState } from "../services/jukebox";
import { SongProgressUi } from "../services/song-progress-ui";

@injectable()
export class Resume implements ICommand {
  public readonly TRIGGER = "resume";

  constructor(
    @inject(TYPES.JUKEBOX) private jukebox: IJukebox,
    @inject(TYPES.SONG_PROGRESS_UI) private ui: SongProgressUi
  ) {}

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
      this.ui.resume();
      reply = "Playback resumed";
    }
    await context.reply(reply);
  }
}
