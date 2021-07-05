import { inject, injectable, multiInject, postConstruct } from "inversify";
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

  // Type hinting
  async run(command: string, context: Message | Interaction) {
    const match = this.commands.find((c) => c.TRIGGER === command);
    if (!match)
      throw new Error(`No commands to be triggered with trigger : ${command}`);
    return await match.run(this.contextFactory(context));
  }
  /**
   * Declare all commands to Discord API.
   * @private
   */
  async publishCommands() {
    await Promise.all(this.commands.map((c) => this.declare(c)));
  }

  /**
   * Declare the command on Discordjs interaction API.
   * This is what allows for slash commands to even be suggested to the user.
   * @see https://discord.com/developers/docs/interactions/slash-commands
   * @param command
   * @private
   */
  private async declare(command: ICommand): Promise<void> {
    const client = this.client();
    const app = await client.application.commands.create(
      command.SCHEMA,
      "416228669095411712"
    );
    console.log(app);
  }
}
