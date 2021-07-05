/**
 * This is the "Interactions" part of an adapter pattern
 */
import {
  Client,
  Guild,
  Interaction,
  User,
  VoiceChannel,
  WebhookClient,
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

  constructor(private client: Client, private interaction: Interaction) {}

  async reply(payload: Record<string, never> | string): Promise<void> {
    if (!this.hasSentFirstReply) {
      await this.sendFirstReply(payload);
      this.hasSentFirstReply = true;
    } else await this.sendFollowUp(payload);
  }

  get author(): User {
    return this.interaction.user;
  }

  get guild(): Guild {
    return this.interaction.guild;
  }

  async getAuthorVoiceChannel(): Promise<VoiceChannel> {
    const asker = await this.guild.members.fetch(this.author.id);
    return asker.voice.channel as VoiceChannel;
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

    await apiAccess
      .interactions(this.interaction.id, this.interaction.token)
      .callback.post({
        data: {
          type: 4,
          data: {
            content: JSON.stringify(payload),
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
