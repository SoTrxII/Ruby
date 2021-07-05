import { ApplicationCommandData, Guild } from "discord.js";
import type { User, Guild, VoiceChannel } from "discord.js";

export interface RubyConfig {
  token: string;
  commandPrefix: string;
}
export interface IContext {
  /** Send a message in the text channel the context was created
   * @param payload Content of the message to send
   * **/
  reply(payload: string): Promise<void>;
  reply(payload: Record<string, never>): Promise<void>;
  /**
   * The users sending the message
   */
  readonly author: User;
  /**
   * Guild from which the message was sent
   */
  readonly guild: Guild;

  /**
   * Get the voice channel of the user sending the message
   */
  getAuthorVoiceChannel(): Promise<VoiceChannel>;
}

export interface ICommand {
  readonly SCHEMA: ApplicationCommandData;
  readonly TRIGGER: string;
  run(context: IContext): Promise<void>;
}
