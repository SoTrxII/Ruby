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

  constructor(private client: Client, private interaction: CommandInteraction) {
    // Signalling that we received the interaction but delaying its execution
    void this.interaction.defer();
  }

  async reply(payload: Record<string, never> | string): Promise<void> {
    // Sometimes, the first reply has been sent by a Discord event,
    // and we have to send a follow up event if we didn't reply yet
    let hasReplied = false;
    while (!hasReplied) {
      try {
        if (!this.hasSentFirstReply) {
          await this.sendFirstReply(payload);
        } else await this.sendFollowUp(payload);
        hasReplied = true;
      } catch {
        // Log it
      } finally {
        this.hasSentFirstReply = true;
      }
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
    return this.interaction.options;
  }

  /**
   * Send the first reply to an interaction. Using this method is mandatory for the first reply
   * @param payload
   * @private
   */
  private async sendFirstReply(payload: string | Record<string, never>) {
    // This part of Djs API isn't made public yet, so we have to
    // " be a little creative"
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const apiAccess = this.client.api as IInteractionStub;
    let toDisplay = payload;
    if (typeof payload !== "string") {
      toDisplay = JSON.stringify(payload);
    }
    await apiAccess
      .interactions(this.interaction.id, this.interaction.token)
      .callback.post({
        data: {
          type: 4,
          data: {
            content: toDisplay,
          },
        },
      });
  }

  /**
   * It's only possible to reply one time to an interaction.
   * To reply one more time, a custom webhook must be used.
   * @note : The custom webhook is only available after a reply has been sent.
   * @param content
   * @private
   */
  private async sendFollowUp(payload: string | Record<string, never>) {
    await new WebhookClient(this.client.user.id, this.interaction.token).send(
      payload
    );
  }
}
