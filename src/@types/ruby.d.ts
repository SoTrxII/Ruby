import { ApplicationCommandData } from "discord.js";

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
}

export interface ICommand {
  readonly SCHEMA: ApplicationCommandData;
  readonly TRIGGER: string;
  run(context: IContext): Promise<void>;
}
