import { inject, injectable } from "inversify";
import {
  IEngine,
  IJukebox,
  ISink,
  SongCallback,
  SongDetails,
} from "../@types/jukebox";
import { TYPES } from "../types";
import type { VoiceChannel } from "discord.js";
import { secondsToIso } from "../components/date-utils";
import { AudioPlayerStatus, VoiceConnection } from "@discordjs/voice";

/** Jukebox playing state */
export enum JukeboxState {
  /** Currently playing a song */
  PLAYING,
  /** Playback paused */
  PAUSED,
  /** Playback stopped*/
  STOPPED,
}
@injectable()
export class Jukebox implements IJukebox {
  private songQueue: string[] = [];

  /** All the callbacks to be executed when a new song starts */
  private songStartCbs: Map<string, SongCallback> = new Map();
  /** All the callbacks to be executed when the song queue is empty */
  private emptyCbs: Map<string, SongCallback> = new Map();

  /** Current voice conenction */
  private voiceConnection: VoiceConnection;

  /** Time to wait before leaving a voice channel */
  private static readonly LEAVING_WAIT_MS = 5 * 60 * 1000;

  constructor(
    @inject(TYPES.ENGINE) private engine: IEngine,
    @inject(TYPES.AUDIO_SINK) private sink: ISink
  ) {}

  async addSong(query: string): Promise<void> {
    this.songQueue.push(await this.engine.search(query));
  }

  async play(channel: VoiceChannel): Promise<void> {
    if (this.songQueue.length === 0) return;
    // Prevent the bot from leaving the voice channel
    this.resetLeavingTimer(-1)();
    this.voiceConnection = await this.sink.joinVoiceChannel(channel);
    const stream = await this.engine.getPlayableStream(this.songQueue[0]);
    stream.on("end", () => this.playNextSongOn(channel));
    await this.sink.play(stream);
  }

  stop(): void {
    if (this.state === JukeboxState.STOPPED) return;
    this.sink.stop();
    this.songQueue = [];
    // Execute all user-provided callback when the playlist is empty
    Array.from(this.emptyCbs.values()).forEach((cb) => void cb());
    this.resetLeavingTimer()();
  }

  pause(): void {
    this.sink.pause();
  }

  resume(): void {
    this.sink.resume();
  }

  skip(channel: VoiceChannel): void {
    this.playNextSongOn(channel);
  }

  onSongStart(id: string, handler: SongCallback): void {
    this.songStartCbs.set(id, handler);
  }

  onPlaylistEmpty(id: string, handler: SongCallback): void {
    this.emptyCbs.set(id, handler);
  }

  get leavingWait(): string {
    return secondsToIso(Jukebox.LEAVING_WAIT_MS / 1000);
  }

  async getCurrent(): Promise<SongDetails> {
    if (this.songQueue.length === 0) return undefined;
    return await this.engine.getDetails(this.songQueue[0]);
  }

  get state(): JukeboxState {
    // We can't directly return this sink state, at it includes buffering
    // which is a way too low level info to get to the jukebox user
    switch (this.sink.state) {
      case AudioPlayerStatus.Playing:
      case AudioPlayerStatus.Buffering:
        return JukeboxState.PLAYING;
        break;
      case AudioPlayerStatus.Paused:
        return JukeboxState.PAUSED;
      case AudioPlayerStatus.Idle:
        return JukeboxState.STOPPED;
      default:
        return JukeboxState.STOPPED;
    }
  }

  async getPrettyQueue(): Promise<string> {
    if (this.songQueue.length === 0)
      return "Nothing in the playlist ! Leaving soon !";
    const queueDetails = await Promise.all(
      this.songQueue.map(async (song) => await this.engine.getDetails(song))
    );

    const formatSong = (song: SongDetails) =>
      `${song.title} - ${song.author} [${secondsToIso(song.duration)}]`;
    // String Builder but it's Javascript :)
    const sb: string[] = [];

    // First check if a song is playing
    if (this.state === JukeboxState.PLAYING) {
      const current = queueDetails[0];
      sb.push(`**Playing** : :musical_note: ${formatSong(current)}`);
      // Remove the playing song from the details queue
      queueDetails.shift();
    }
    // Then, print each song remaining in the queue
    queueDetails.forEach((song, index) =>
      sb.push(`${index + 1}) ${formatSong(song)}`)
    );

    // Finally, "build" the string
    return sb.join("\n");
  }

  /**
   * Play the next song in the playlist on the provided voice channel
   * @param channel
   * @private
   */
  private playNextSongOn(channel: VoiceChannel): void {
    this.songQueue.shift();
    // Execute all user-provided callback when a new song is about to start
    Array.from(this.songStartCbs.values()).forEach((cb) => void cb());
    this.stop();
    void this.play(channel);
  }

  /**
   * Wait a certain amount of time before leaving the voice channel
   * Setting the time to -1 will cancel the leaving timeout
   * @private
   */
  private resetLeavingTimer(time = Jukebox.LEAVING_WAIT_MS) {
    let timeout;
    return () => {
      if (timeout !== undefined) clearTimeout(timeout);
      if (time !== -1)
        timeout = setTimeout(() => this.voiceConnection.disconnect(), time);
    };
  }
}
