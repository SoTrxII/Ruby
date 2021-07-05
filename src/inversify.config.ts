import { Container } from "inversify";
import { TYPES } from "./types";
import { Ruby } from "./Ruby";
import { env } from "process";
import { Client, Interaction, Message } from "discord.js";
import { MessageAdapter } from "./components/context/message-context-adapter";
import { InteractionAdapter } from "./components/context/interaction-context-adapter";
import { IContext } from "./@types/ruby";
import { CommandsLoader } from "./services/commands-loader";
import { Play } from "./commands/play";
import { IEngine } from "./@types/jukebox";
import { YoutubeEngine } from "./services/engines/youtube-engine";

export const container = new Container();

// The Client refer to DiscordJs Bot client.
// This client is only initiated when Ruby is created
// By creating a factory, the client will be dynamically resolved without actually setting it
// as a global variable
container
  .bind<() => Client>(TYPES.CLIENT_FACTORY)
  .toFactory<Client>(
    (context) => () => context.container.get<Ruby>(TYPES.RUBY).client
  );

// Set the search engine for the videos to Youtube
container
  .bind<IEngine>(TYPES.ENGINE)
  .toConstantValue(new YoutubeEngine(env.YOUTUBE_PARSER_KEY));

// This is a fancy way of implementing a Factory pattern.
container
  .bind(TYPES.CONTEXT_FACTORY)
  .toFactory<IContext>((diContext) => (provider: Message | Interaction) => {
    const client = diContext.container.get<() => Client>(
      TYPES.CLIENT_FACTORY
    )();
    switch (provider.constructor.name) {
      case "Message":
        return new MessageAdapter(client, provider as Message);
        break;
      // /!\ Interactions have no dedicated class
      case "Object":
        return new InteractionAdapter(client, provider as Interaction);
        break;
      default:
        throw new Error(
          `Cannot find any implementations for provider ${provider.constructor.name}`
        );
    }
  });
container.bind(TYPES.COMMAND).to(Play);

container.bind(TYPES.COMMAND_LOADER).to(CommandsLoader);
container.bind<Ruby>(TYPES.RUBY).toConstantValue(
  new Ruby(container.get(TYPES.COMMAND_LOADER), {
    token: env.RUBY_TOKEN,
    commandPrefix: env.COMMAND_PREFIX,
  })
);
