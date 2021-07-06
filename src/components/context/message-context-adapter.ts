import {
  ApplicationCommandOption,
  ApplicationCommandOptionData,
  Client,
  Collection,
  CommandInteractionOption,
  Guild,
  Message,
  User,
  VoiceChannel,
} from "discord.js";
import { IContext } from "../../@types/ruby";

export class MessageAdapter implements IContext {
  constructor(private client: Client, private message: Message) {}

  async reply(payload: Record<string, never> | string): Promise<void> {
    await this.message.channel.send(payload);
  }

  get author(): User {
    return this.message.author;
  }

  getGuild(): Promise<Guild> {
    return Promise.resolve(this.message.guild);
  }

  getArgs(
    schema: ApplicationCommandOption[]
  ): Collection<string, CommandInteractionOption> {
    return this.parseArgs(this.message.content, schema);
  }

  /**
   * Given a message string content, attempt to parse the arguments of the message.
   * Arguments not included in schema will be ignored
   * @param content
   * @private
   */
  private parseArgs(
    content: string,
    schema: ApplicationCommandOptionData[]
  ): Collection<string, CommandInteractionOption> {
    const args = new Collection<string, CommandInteractionOption>();
    content
      .split(/\s+/)
      // Remove trigger and args not in schema
      .splice(1, schema.length)
      .map((rawArg, index) => {
        const opt: CommandInteractionOption = {
          type: this.getTypeOfArgument(rawArg).type,
          name: schema[index].name,
          value: rawArg
        };
        return opt;
      })
      .forEach((opt) => args.set(opt.name, opt));
    return args;
  }

  /**
   * Return the type of the provided raw argument
   * @param rawArg
   * @private
   */
  private getTypeOfArgument(rawArg: string): Partial<CommandInteractionOption> {
    if (!isNaN(+rawArg)) return { type: "INTEGER" };
    if (rawArg.toLowerCase() == "true" || rawArg.toLowerCase() == "false")
      return { type: "BOOLEAN" };
    // @TODO : Check for any non trivial type (User ? channel ?)
    return { type: "STRING" };
  }

  async getAuthorVoiceChannel(): Promise<VoiceChannel> {
    const asker = await (await this.getGuild()).members.fetch(this.author.id);
    return asker.voice.channel as VoiceChannel;
  }
}
