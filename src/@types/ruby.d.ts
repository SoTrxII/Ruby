import {
  ApplicationCommandData,
  ApplicationCommandOption,
  ApplicationCommandOptionData,
  Collection,
  CommandInteractionOption,
  Guild,
} from "discord.js";
import type { User, Guild, VoiceChannel } from "discord.js";

export interface RubyConfig {
  token: string;
  commandPrefix: string;
  serverId: `${bigint}`;
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
  readonly author: Partial<User>;
  /**
   * Guild from which the message was sent
   */
  getGuild(): Promise<Guild>;

  /**
   * Commands arguments
   */
  getArgs(
    schema: ApplicationCommandOptionData[]
  ): Collection<string, CommandInteractionOption>;
  /**
   * Get the voice channel of the user sending the message
   */
  getAuthorVoiceChannel(): Promise<VoiceChannel>;
}

export interface ICommand {
  readonly SCHEMA: ICommandData;
  readonly TRIGGER: string;
  run(context: IContext): Promise<void>;
}
export interface ICommandData {
  name: string;
  description: string;
  options?: [
    {
      type: ApplicationCommandOptionTypes,
      name: string,
      required: boolean;
      description: string;
    },
  ],
};

