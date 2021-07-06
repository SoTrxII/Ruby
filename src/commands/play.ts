import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IJukebox } from "../@types/jukebox";
import { JukeboxState } from "../services/jukebox";
import { SongProgressUi } from "../services/song-progress-ui";

@injectable()
export class Play implements ICommand {
  public readonly TRIGGER = "play";

  constructor(
    @inject(TYPES.JUKEBOX) private jukebox: IJukebox,
    @inject(TYPES.SONG_PROGRESS_UI) private ui: SongProgressUi
  ) {}

  public readonly SCHEMA: ApplicationCommandData = {
    name: "play",
    description: "Play a music on the voice channel of the calling user",
    options: [
      {
        name: "query",
        description: "What to search for",
        required: true,
        type: "STRING",
      },
    ],
  };

  async run(context: IContext): Promise<void> {
    const vc = await context.getAuthorVoiceChannel();
    if (!vc) {
      await context.reply(`You must be in a voice channel !`);
      return;
    }
    // Display next song to play
    this.jukebox.onSongStart(
      "display",
      async () => await context.reply(await this.jukebox.getPrettyQueue())
    );
    // Reset the ui for the next song
    this.jukebox.onSongStart("resetUi", async () => {
      const current = await this.jukebox.getCurrent();
      if (current !== undefined) this.ui.start(current);
      else this.ui.stop();
    });

    this.jukebox.onPlaylistEmpty("resetUi", () => void this.ui.stop());

    const args = context.getArgs(this.SCHEMA.options);
    const q = String(args.get("query").value);
    await this.jukebox.addSong(q);
    if (this.jukebox.state !== JukeboxState.PLAYING)
      await this.jukebox.play(vc);
    // Reset the ui for current song
    this.ui.start(await this.jukebox.getCurrent());
    // Display current song
    await context.reply(await this.jukebox.getPrettyQueue());
  }
}
