import { inject } from "inversify";
import { IEngine } from "../@types/jukebox";
import { TYPES } from "../types";

export class Jukebox {
    private songQueue = [];

    constructor(@inject(TYPES.ENGINE) private engine : IEngine){};

    async addSong(query: string): Promise<void>{
        this.songQueue.push(await this.engine.search(query));
    }

    //removeSong(): Promise<void>


}