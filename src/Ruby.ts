import { CommandoClient } from "discord.js-commando";
import { join } from "path";
import { injectable } from "inversify";

export interface RubyConfig {
  commandPrefix: string;
  owner: string[];
  token: string;
}
@injectable()
export class Ruby {
  constructor(private config: RubyConfig) {}

  public client = new CommandoClient({
    commandPrefix: this.config.commandPrefix,
    owner: this.config.owner
  });

  public async bootUp(): Promise<void> {
    this.client.registry
      .registerDefaultTypes()
      .registerGroups([["musique", "Un bruit agréable"]])
      .registerDefaultGroups()
      .registerDefaultCommands({
        ping: false,
        eval: false,
        unknownCommand: false
      })
      .registerCommandsIn(join(__dirname, "commands"));

    this.client.once("ready", () => console.log("Up & Ready"));
    this.client.on("error", console.error);
    await this.client.login(this.config.token).catch(console.error);
  }
}
