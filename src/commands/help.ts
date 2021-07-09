import type { ICommand, IContext } from "../@types/ruby";
import type { ApplicationCommandData } from "discord.js";
import { injectable } from "inversify";
import { TYPES } from "../types";
import { container } from "../inversify.config";

@injectable()
export class Help implements ICommand {
  public readonly TRIGGER = "help";

  public readonly SCHEMA: ApplicationCommandData = {
    name: "help",
    description: "Send a pretty printing of available commands",
  };

  async run(context: IContext): Promise<void> {
    // This cannot be injected at buildtime, as we commands would include
    // itself, creating a loop
    const commandsSchema = container
      .getAll<ICommand>(TYPES.COMMAND)
      .map((c) => `**${c.SCHEMA.name}**  --> ${c.SCHEMA.description}`)
      .join("\n");

    await context.reply(commandsSchema);
  }
}
