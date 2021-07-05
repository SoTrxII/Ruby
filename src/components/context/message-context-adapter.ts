import { Client, Message } from "discord.js";
import { IContext } from "../../@types/ruby";

export class MessageAdapter implements IContext {
  constructor(private client: Client, private message: Message) {}

  async reply(payload: Record<string, never>): Promise<void>;
  async reply(payload: string): Promise<void>;
  async reply(payload: any): Promise<void> {
    await this.message.channel.send(payload);
  }
}
