import { Container } from "inversify";
import { TYPES } from "./types";
import { Ruby } from "./Ruby";
import { env } from "process";
import { Client, Message, CommandInteraction } from "discord.js";
import { MessageAdapter } from "./components/context/message-context-adapter";
import { InteractionAdapter } from "./components/context/interaction-context-adapter";
import { IContext } from "./@types/ruby";
import { CommandsLoader } from "./services/commands-loader";
import { Play } from "./commands/play";
import { IEngine, IJukebox, ISink } from "./@types/jukebox";
import { YoutubeEngine } from "./services/engines/youtube-engine";
import { DiscordSink } from "./services/discord-sink";
import { Jukebox } from "./services/jukebox";
import { Stop } from "./commands/stop";
import { Pause } from "./commands/pause";
import { Resume } from "./commands/resume";
import { Skip } from "./commands/skip";
import { SongProgressUi } from "./services/song-progress-ui";
import { google } from "googleapis";
import * as djs from "@discordjs/voice";

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

container.bind(TYPES.YOUTUBE_API).toConstantValue(
  google.youtube({
    version: "v3",
    auth: env.YOUTUBE_PARSER_KEY,
  })
);
// Set the search engine for the videos to Youtube
container.bind<IEngine>(TYPES.ENGINE).to(YoutubeEngine);

// Separating Djs Voice support from the audio sink, to allow to test the sink
container.bind(TYPES.DJS_VOICE).toConstantValue(djs);
// Set the Audio target of our bot. This is a Discord voice dispatcher.
container.bind<ISink>(TYPES.AUDIO_SINK).to(DiscordSink).inSingletonScope();

// And then declare the Jukebox, using both the search engine and the audio sink
container.bind<IJukebox>(TYPES.JUKEBOX).to(Jukebox).inSingletonScope();

container
  .bind<SongProgressUi>(TYPES.SONG_PROGRESS_UI)
  .to(SongProgressUi)
  .inSingletonScope();

// This is a fancy way of implementing a Factory pattern.
container
  .bind(TYPES.CONTEXT_FACTORY)
  .toFactory<IContext>(
    (diContext) => (provider: Message | CommandInteraction) => {
      const client = diContext.container.get<() => Client>(
        TYPES.CLIENT_FACTORY
      )();
      switch (provider.constructor.name) {
        case "Message":
          return new MessageAdapter(client, provider as Message);
          break;
        case "CommandInteraction":
          return new InteractionAdapter(client, provider as CommandInteraction);
          break;
        default:
          throw new Error(
            `Cannot find any implementations for provider ${provider.constructor.name}`
          );
      }
    }
  );

// Declare all the bot commands
container.bind(TYPES.COMMAND).to(Play);
container.bind(TYPES.COMMAND).to(Stop);
container.bind(TYPES.COMMAND).to(Pause);
container.bind(TYPES.COMMAND).to(Resume);
container.bind(TYPES.COMMAND).to(Skip);

container.bind(TYPES.COMMAND_LOADER).to(CommandsLoader);
container.bind<Ruby>(TYPES.RUBY).toConstantValue(
  new Ruby(container.get(TYPES.COMMAND_LOADER), {
    token: env.RUBY_TOKEN,
    commandPrefix: env.COMMAND_PREFIX,
  })
);
