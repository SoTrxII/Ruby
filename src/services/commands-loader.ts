import { inject, injectable, multiInject } from "inversify";
import { TYPES } from "../types";
import { ICommand, IContext } from "../@types/ruby";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v9";
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
  async publishCommands(serverId?: `${bigint}`): Promise<void> {
    const client = this.client();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rest = new REST({ version: "9" }).setToken(client.token);
    const cDefs = this.commands.map((c) => c.SCHEMA);
    if(serverId){
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      await rest.put(
          Routes.applicationGuildCommands(client.application.id, serverId),
          { body: cDefs },
      );
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    await rest.put(
        Routes.applicationCommands(client.application.id),
        { body: cDefs },
    );
  }
}
