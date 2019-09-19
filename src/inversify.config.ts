import "reflect-metadata";
import { Container } from "inversify";
import { TYPES } from "./types";
import { SearchService } from "./classes/Search/search-service";
import { YoutubeSearch } from "./classes/Search/youtube-search";
import { Client } from "discord.js";
import { Jukebox } from "./classes/Jukebox/jukebox";

const container = new Container();
container.bind<Client>(TYPES.Client).toConstantValue(new Client());
container.bind<Jukebox>(TYPES.Jukebox).to(Jukebox);
container.bind<SearchService>(TYPES.SearchServices).to(YoutubeSearch);

export default container;
