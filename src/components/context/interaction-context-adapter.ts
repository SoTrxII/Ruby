/**
 * This is the "Interactions" part of an adapter pattern
 */
import {
  Client,
  Guild,
  User,
  VoiceChannel,
  WebhookClient,
  ApplicationCommandOption,
  CommandInteraction,
  CommandInteractionOption,
  Collection,
  ApplicationCommandOptionData,
} from "discord.js";
import { injectable } from "inversify";
import { IContext } from "../../@types/ruby";

/**
 * Stub typing for the Djs interaction API.
 * This should be deleted as soon as the true Djs typing for this API
 * is made public
 * */
interface IInteractionStub {
  interactions(
    id: string,
    token: string
  ): { callback: { post: (InteractionResponseTypes) => Promise<void> } };
}

@injectable()
export class InteractionAdapter implements IContext {
  /** True if this interaction already received a reply **/
  private hasSentFirstReply = false;
  private readonly deferHandle: Promise<void>;


  constructor(private client: Client, private interaction: CommandInteraction) {
    // Signalling that we received the interaction but delaying its execution
    this.deferHandle = void this.interaction.deferReply();
  }

  async reply(payload: Record<string, never> | string): Promise<void> {
    await this.deferHandle;
    if (this.interaction.deferred || this.interaction.replied) {
      await this.interaction.editReply(payload);
    } else {
      await this.interaction.reply(payload);
    }
  }

  get author(): Partial<User> {
    return this.interaction.user;
  }

  async getGuild(): Promise<Guild> {
    return await this.client.guilds.fetch(this.interaction.guild.id);
  }

  async getAuthorVoiceChannel(): Promise<VoiceChannel> {
    const asker = await (await this.getGuild()).members.fetch(this.author.id);
    return asker.voice.channel as VoiceChannel;
  }

  getArgs(
    schema: ApplicationCommandOptionData[]
  ): Collection<string, CommandInteractionOption> {
    const col = new Collection<string, CommandInteractionOption>();
    this.interaction.options.data.forEach((opt) => col.set(opt.name, opt));
    return col;
  }
}
