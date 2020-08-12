import { Container } from "inversify";
import { TYPES } from "./types";
import { Ruby } from "./Ruby";
import { SearchAPI } from "./@types/search-API";
import { YoutubeSearchService } from "./services/youtube-search-service";
import { JukeboxAPI } from "./@types/jukebox-API";
import { Jukebox } from "./components/jukebox";
import { YoutubeDownloadService } from "./services/youtube-download-service";
import { DownloadAPI } from "./@types/youtube-downloader-API";

export const container = new Container();

container.bind<Ruby>(TYPES.Ruby).toConstantValue(
  new Ruby({
    token: process.env.RUBY_TOKEN,
    owner: process.env.OWNER.split(",").map(s => s.trim()),
    commandPrefix: process.env.COMMAND_PREFX
  })
);

container
  .bind<SearchAPI>(TYPES.YoutubeService)
  .toConstantValue(new YoutubeSearchService(process.env.YOUTUBE_PARSER_KEY));

container
  .bind<JukeboxAPI>(TYPES.Jukebox)
  .to(Jukebox)
  .inSingletonScope();

container.bind<DownloadAPI>(TYPES.YoutubeDownload).to(YoutubeDownloadService);
