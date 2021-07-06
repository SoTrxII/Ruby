import { inject, injectable } from "inversify";
import {
  Client,
  CommandInteraction,
  Intents,
  Interaction,
  Message,
} from "discord.js";
import { RubyConfig } from "./@types/ruby";
import { TYPES } from "./types";
import { CommandsLoader } from "./services/commands-loader";

@injectable()
export class Ruby {
  constructor(
    @inject(TYPES.COMMAND_LOADER) private loader: CommandsLoader,
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
    this.client.once("ready", () => console.log("Up & Ready"));
    await this.client.login(this.config.token);

    // Register all slash commands
    await this.loader.publishCommands();
    // React to slash commands
    this.client.ws.on("INTERACTION_CREATE", (rawInteraction) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      const command = rawInteraction.data.name.toLowerCase();
      const interaction = new CommandInteraction(this.client, rawInteraction);
      void this.executeCommand(command, interaction);
    });

    // React to messages
    this.client.on("message", (message: Message) => {
      const isCommand = (content: string) =>
        content.startsWith(this.config.commandPrefix);
      // Prevent bot responding to itself
      const isNotSelf = (message: Message) =>
        message.author.id !== this.client.user.id;

      if (isCommand(message.content) && isNotSelf(message))
        void this.executeCommand(
          message.content.split(/\s+/)[0].substring(1),
          message
        );
    });
  }

  private async executeCommand(
    command: string,
    context: Interaction | Message
  ): Promise<void> {
    await this.loader.run(command, context);
  }
}
