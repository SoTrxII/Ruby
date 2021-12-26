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
    schema: any[]
  ): Collection<string, CommandInteractionOption> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
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
    let argArray = content.split(/\s+/);
    // Remove trigger
    argArray.shift();

    // Special case : If the only argument of a command is a string, it can contain spaces
    if (schema.filter((opt) => opt.type === "STRING").length === 1) {
      argArray = [argArray.join(" ")];
    } else {
      argArray.splice(1, schema.length);
    }
    argArray
      .map((rawArg, index) => {
        const parsed = this.getTypeOfArgument(rawArg);
        if (parsed.type !== schema[index].type)
          throw new Error(
            `Wrong value for arg ${schema[index].name} (${
              schema[index].type
            }) : ${String(parsed.value)}`
          );
        const opt: CommandInteractionOption = {
          type: parsed.type,
          name: schema[index].name,
          value: parsed.value,
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
    if (!isNaN(+rawArg)) return { type: "INTEGER", value: +rawArg };
    if (rawArg.toLowerCase() == "true" || rawArg.toLowerCase() == "false")
      return { type: "BOOLEAN", value: rawArg.toLowerCase() == "true" };
    // @TODO : Check for any non trivial type (User ? channel ?)
    return { type: "STRING", value: rawArg };
  }

  async getAuthorVoiceChannel(): Promise<VoiceChannel> {
    const asker = await (await this.getGuild()).members.fetch(this.author.id);
    return asker.voice.channel as VoiceChannel;
  }
}
