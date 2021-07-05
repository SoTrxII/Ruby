import { ICommand, IContext } from "../@types/ruby";
import { ApplicationCommandData } from "discord.js";
import { injectable } from "inversify";

@injectable()
export class Play implements ICommand {
  public readonly TRIGGER = "play";
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
    await context.reply("NYAAAAA");
    await context.reply("NYAAAAA2");
  }
}
