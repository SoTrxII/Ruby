import { inject, injectable } from "inversify";
import {
  Client,
  CommandInteraction,
  Intents,
  Interaction,
  Message,
} from "discord.js";
import { IContext, RubyConfig } from "./@types/ruby";
import { TYPES } from "./types";
import { CommandsLoader } from "./services/commands-loader";
import { ILogger } from "./@types/logger";
import { container } from "./inversify.config";

@injectable()
export class Ruby {
  constructor(
    @inject(TYPES.COMMAND_LOADER) private loader: CommandsLoader,
    @inject(TYPES.LOGGER) private logger: ILogger,
    private config: RubyConfig
  ) {}

  public client = new Client({
    intents: [
      Intents.FLAGS.GUILDS,
      Intents.FLAGS.GUILD_MESSAGES,
      Intents.FLAGS.GUILD_VOICE_STATES,
    ],
  });

  public async bootUp(): Promise<void> {
    this.client.once("ready", () =>
      this.logger.log(
        "Bot woken up, waiting for slash commands to be published !"
      )
    );
    await this.client.login(this.config.token);
    // React to messages
    this.client.on("message", (message: Message) => {
      const isCommand = (content: string) =>
        content.startsWith(this.config.commandPrefix);
      // Prevent bot responding to itself
      const isNotSelf = (message: Message) =>
        message.author.id !== this.client.user.id;

      if (isCommand(message.content) && isNotSelf(message)) {
        this.logger.log(
          `Received command message from ${message.author.username} : ${message.content}`
        );
        void this.executeCommand(
          message.content.split(/\s+/)[0].substring(1),
          message,
          message.author.username
        );
      }
    });
    // Register all slash commands
    await this.loader.publishCommands();
    this.logger.log("Commands published ! Ready to go !");
    // React to slash commands
    this.client.ws.on("INTERACTION_CREATE", (rawInteraction) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      const command = rawInteraction.data.name.toLowerCase();
      const interaction = new CommandInteraction(this.client, rawInteraction);
      this.logger.log(
        `Received command interaction from ${interaction.user.username} : ${interaction.commandName}`
      );
      void this.executeCommand(command, interaction, interaction.user.username);
    });
  }

  /**
   * Execute a command
   * @param command which command
   * @param context context to execute the command with. Interaction or message.
   * @param author who started the command
   * @private
   */
  private async executeCommand(
    command: string,
    context: Interaction | Message,
    author: string
  ): Promise<void> {
    try {
      await this.loader.run(command, context);
    } catch (e: unknown) {
      await container
        .get<(context) => IContext>(TYPES.CONTEXT_FACTORY)(context)
        .reply(`Command failed : ${e.toString()}`);
      this.logger.error(
        `Command execution failed. From ${author} : ${command}. Error ${e.toString()}`
      );
    }
  }
}
