import { Container } from "inversify";
import { TYPES } from "./types";
import { Ruby } from "./Ruby";
import { SearchAPI } from "./@types/search-API";
import { YoutubeSearchService } from "./services/youtube-search-service";
import * as config from "../config.json";
import { JukeboxAPI } from "./@types/jukebox-API";
import { Jukebox } from "./components/jukebox";
import { YoutubeDownloadService } from "./services/youtube-download-service";
import { DownloadAPI } from "./@types/youtube-downloader-API";
export const container = new Container();

container.bind<Ruby>(TYPES.Ruby).to(Ruby);

container
  .bind<SearchAPI>(TYPES.YoutubeService)
  .toConstantValue(new YoutubeSearchService(config.API.Google.youtubeParser));

container
  .bind<JukeboxAPI>(TYPES.Jukebox)
  .to(Jukebox)
  .inSingletonScope();

container.bind<DownloadAPI>(TYPES.YoutubeDownload).to(YoutubeDownloadService);
