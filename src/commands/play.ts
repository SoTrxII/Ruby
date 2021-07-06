import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";
import { IJukebox } from "../@types/jukebox";
import { JukeboxState } from "../services/jukebox";

@injectable()
export class Play implements ICommand {
  public readonly TRIGGER = "play";

  constructor(@inject(TYPES.JUKEBOX) private jukebox: IJukebox) {}

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
    this.jukebox.onSongStart(
      "display",
      async () => await context.reply(await this.jukebox.getPrettyQueue())
    );
    const args = context.getArgs(this.SCHEMA.options);
    const q = String(args.get("query").value);
    await this.jukebox.addSong(q);
    if (this.jukebox.state !== JukeboxState.PLAYING)
      await this.jukebox.play(vc);
    await context.reply(await this.jukebox.getPrettyQueue());
  }
}
