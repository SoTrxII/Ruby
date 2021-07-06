import { inject, injectable, multiInject } from "inversify";
import { TYPES } from "../types";
import { ICommand, IContext } from "../@types/ruby";
import { Client, Interaction, Message } from "discord.js";

@injectable()
export class CommandsLoader {
  constructor(
    @inject(TYPES.CLIENT_FACTORY) private client: () => Client,
    @inject(TYPES.CONTEXT_FACTORY)
    private contextFactory: (provider: Message | Interaction) => IContext,
    @multiInject(TYPES.COMMAND) private commands: ICommand[]
  ) {}

  /**
   * Execute the given
   * @param command
   * @param context
   * @returns
   */
  async run(command: string, context: Message | Interaction): Promise<void> {
    const match = this.commands.find((c) => c.TRIGGER === command);
    if (!match)
      throw new Error(`No commands to be triggered with trigger : ${command}`);
    return await match.run(this.contextFactory(context));
  }
  /**
   * Declare all commands to Discord API.
   * @see https://discord.com/developers/docs/interactions/slash-commands
   * @private
   */
  async publishCommands(): Promise<void> {
    const client = this.client();
    const cDefs = this.commands.map((c) => c.SCHEMA);
    const servCommands = await client.application.commands.fetch();
    await Promise.all(
      servCommands.map(async (sCommand) => await sCommand.delete())
    );
    await client.application.commands.set(cDefs, "416228669095411712");
  }
}
