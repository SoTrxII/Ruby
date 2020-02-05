import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";
import { SearchService } from "./components/Search/search-service";
import { YoutubeSearch } from "./components/Search/youtube-search";
import { Client } from "discord.js";
import { Jukebox } from "./components/Jukebox/jukebox";

const container = new Container();
container.bind<Client>(TYPES.Client).toConstantValue(new Client());
container.bind<Jukebox>(TYPES.Jukebox).to(Jukebox);
container.bind<SearchService>(TYPES.SearchServices).to(YoutubeSearch);

export default container;
