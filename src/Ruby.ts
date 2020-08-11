import * as config from "../config.json";
import { CommandoClient } from "discord.js-commando";
import { join } from "path";
import { injectable } from "inversify";

@injectable()
export class Ruby {
  public client = new CommandoClient({
    commandPrefix: "?",
    owner: config.Discord.MastersIds
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
    await this.client.login(config.Discord.Token).catch(console.error);
  }
}
