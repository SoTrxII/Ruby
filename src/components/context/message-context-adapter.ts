import { Client, Guild, Message, User, VoiceChannel } from "discord.js";
import { IContext } from "../../@types/ruby";

export class MessageAdapter implements IContext {
  constructor(private client: Client, private message: Message) {}

  async reply(payload: Record<string, never> | string): Promise<void> {
    await this.message.channel.send(payload);
  }

  get author(): User {
    return this.message.author;
  }

  get guild(): Guild {
    return this.message.guild;
  }

  async getAuthorVoiceChannel(): Promise<VoiceChannel> {
    const asker = await this.guild.members.fetch(this.author.id);
    return asker.voice.channel as VoiceChannel;
  }
}
