import { JukeboxAPI } from "../@types/jukebox-API";
import { inject, injectable } from "inversify";
import { StreamDispatcher, VoiceChannel, VoiceConnection } from "discord.js";
import { JukeboxItemAPI, JukeboxItemDetails } from "../@types/jukebox-item-API";
import { TYPES } from "../types";
import { SearchAPI } from "../@types/search-API";
import { JukeboxYoutubeItem } from "./jukebox-youtube-item";
import { assertState } from "../decorators/assert-state";
import Timer = NodeJS.Timer;

export enum JUKEBOX_STATE {
  NOT_INITIALIZED,
  PLAYING,
  PAUSED,
  STOPPED,
}

export class InvalidQueryError extends Error {}
export class InvalidStateError extends Error {}
type Procedure = (...args: any[]) => void;
@injectable()
export class Jukebox implements JukeboxAPI {
  private static readonly TIME_TO_DISCONNECT = 5 * 60 * 1000;
  private disconnectTimer: Timer;
  public state = JUKEBOX_STATE.NOT_INITIALIZED;
  private voiceConnection: VoiceConnection;
  private dispatcher: StreamDispatcher;
  public currentSong: JukeboxItemAPI;
  private songQueue: JukeboxItemAPI[] = [];
  private searchEngine: SearchAPI;
  private transitionPipeline: Procedure[] = [];
  private queueEmptyPipeline: Procedure[] = [];

  constructor(@inject(TYPES.YoutubeService) engine) {
    this.searchEngine = engine;
  }

  async addSong(query: string): Promise<void> {
    if (!this.searchEngine.isProperLink(query)) {
      query = await this.searchEngine.searchFirstURL(query);
    }
    if (!query) throw new InvalidQueryError();

    this.songQueue.push(new JukeboxYoutubeItem(query));
  }

  get queue(): JukeboxItemAPI[] {
    return this.songQueue;
  }

  onNewSong(f: Procedure): void {
    this.transitionPipeline.push(f);
  }

  onQueueEmpty(f: Procedure): void {
    this.queueEmptyPipeline.push(f);
  }

  async getCurrentSongDetails(): Promise<JukeboxItemDetails> {
    return this.currentSong.getDetails();
  }

  async connect(vc: VoiceChannel): Promise<void> {
    this.voiceConnection = await vc.join();
    this.state = JUKEBOX_STATE.STOPPED;
  }

  private endDispatcher() {
    this.dispatcher.end();
    this.dispatcher = undefined;
    this.state = JUKEBOX_STATE.STOPPED;
    this.queueEmptyPipeline.forEach((f) => f());
    this.disconnectTimer = setTimeout(() => {
      this.voiceConnection.disconnect();
      this.voiceConnection = undefined;
      this.state = JUKEBOX_STATE.NOT_INITIALIZED;
    }, Jukebox.TIME_TO_DISCONNECT);
  }

  @assertState(JUKEBOX_STATE.PLAYING)
  async stop(): Promise<void> {
    this.songQueue = [];
    await this.playNextSong(false);
  }

  private async playNextSong(accountForLooping = true) {
    // Replay the same song if looping is activated
    this.currentSong =
      accountForLooping && this.currentSong?.isLooping
        ? this.currentSong
        : this.songQueue.shift();

    if (this.currentSong === undefined) {
      if (this.dispatcher) this.endDispatcher();
    } else {
      this.state = JUKEBOX_STATE.PLAYING;
      try {
        this.dispatcher = await this.currentSong?.play(this.voiceConnection);
        this.dispatcher.on("finish", async () => {
          await this.playNextSong();
          if (this.currentSong) this.transitionPipeline.forEach((f) => f());
        });
      } catch (e) {
        console.error(e);
        await this.playNextSong();
        if (this.currentSong) this.transitionPipeline.forEach((f) => f());
      }
    }
  }

  @assertState(JUKEBOX_STATE.STOPPED, JUKEBOX_STATE.PAUSED)
  async play(): Promise<void> {
    if (this.disconnectTimer) clearTimeout(this.disconnectTimer);
    await this.playNextSong();
  }

  @assertState(JUKEBOX_STATE.PLAYING)
  pause(): void {
    this.dispatcher.pause();
    this.state = JUKEBOX_STATE.PAUSED;
  }

  @assertState(JUKEBOX_STATE.PAUSED)
  resume(): void {
    this.dispatcher.resume();
    this.state = JUKEBOX_STATE.PLAYING;
  }

  @assertState(JUKEBOX_STATE.PLAYING)
  loop(isLooping: boolean): void {
    if (this.currentSong) this.currentSong.isLooping = isLooping;
  }

  @assertState(JUKEBOX_STATE.PLAYING)
  async skip(): Promise<void> {
    await this.playNextSong(false);
  }

  remove(index: number): void {
    const zeroBasedIndex = index - 1;
    if (this.queue.length <= zeroBasedIndex || zeroBasedIndex < 0)
      throw new InvalidStateError();
    this.queue.splice(zeroBasedIndex, 1);
  }
}
