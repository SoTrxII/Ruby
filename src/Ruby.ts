import { CommandoClient, CommandoMessage } from "discord.js-commando";
import { join } from "path";
import { injectable } from "inversify";
import { TextChannel } from "discord.js";

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
    owner: this.config.owner,
  });

  public async bootUp(): Promise<void> {
    this.client.registry
      .registerDefaultTypes()
      .registerGroups([["music", "Computer generated noises"]])
      .registerDefaultGroups()
      .registerDefaultCommands({
        ping: false,
        eval: false,
        unknownCommand: false,
      })
      .registerCommandsIn(join(__dirname, "commands"));

    this.client.once("ready", async () => {
      console.log("Up & Ready");
      await this.registerSlashCommands();
    });
    this.client.on("error", console.error);
    await this.client.login(this.config.token).catch(console.error);
  }

  private async registerSlashCommands() {
    // The client API is a private member, we shouldn't be able to use it.
    // However, this is the only real way to access slash commands in DJS v12.
    // Version 13 should make this less dirty
    // @TODO Check for V13 (last 27/06/21)
    // @ts-ignore
    const clientApi = this.client.api as any;
    const app = clientApi.applications(this.client.user.id);
    const serverCommands = await app.commands.get();
    console.log(serverCommands);
    const botCommands = (await this.client.registry.commands)
      // Discord-commando adds default commands for managing other commands.
      // These don't need to be registered.
      .filter((c) => !c.ownerOnly && !c.description.includes("command"))
      .map((c) => {
        return {
          name: c.name,
          aliases: c.aliases,
          description: c.description,
          options:
            c.argsCollector?.args.map((a) => {
              return {
                name: a.key,
                type: 3,
                description: a.prompt,
                required: a.default !== undefined && a.default !== null,
              };
            }) ?? [],
        };
      });
    const serverCommandsNames = serverCommands?.map((c) => c.name);

    // Register all new commands
    const newCommands = botCommands.filter(
      (c) => !serverCommandsNames.includes(c.name)
    );
    let currentCommand;
    try {
      for (const nc of newCommands) {
        currentCommand = nc;
        await clientApi.post({ data: nc });
      }
      await Promise.all(
        newCommands.map(async (nc) => await clientApi.post({ data: nc }))
      );
    } catch (e) {
      console.log("FAILED");
      console.log("Command : ");
      console.log(currentCommand);
      console.log(e);
    }

    // The event isn't documented yet, we must ignore the error
    // @ts-ignore
    this.client.ws.on("INTERACTION_CREATE", async (interaction) => {
      const command = interaction.data.name.toLowerCase();
      const options = [];
      interaction.data.options?.forEach(
        (opt) => (options[opt.name] = opt.value)
      );
      const result = await (
        await this.client.registry.commands
      ).find((bc) => bc.name === command);

      const message = new CommandoMessage(
        this.client,
        {
          author: interaction.member,
          timestamp: new Date().toISOString(),
          id: interaction.id,
        },
        (await this.client.channels.fetch(
          interaction.channel_id
        )) as TextChannel
      );
      await result.run(undefined, options, true);
      console.log("DONE !");
      console.log(result);
    });

    // Update all existing commands
    /*const existingCommands = botCommands.filter((c) =>
        serverCommandsNames.includes(c.name)
    ).map()
    console.log(existingCommands);*/
  }
}
