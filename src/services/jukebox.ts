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
import { AudioPlayerStatus } from "@discordjs/voice";

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

  constructor(
    @inject(TYPES.ENGINE) private engine: IEngine,
    @inject(TYPES.AUDIO_SINK) private sink: ISink
  ) {}

  async addSong(query: string): Promise<void> {
    this.songQueue.push(await this.engine.search(query));
  }

  async play(channel: VoiceChannel): Promise<void> {
    if (this.songQueue.length === 0) return;
    await this.sink.joinVoiceChannel(channel);
    const stream = await this.engine.getPlayableStream(this.songQueue[0]);
    stream.on("end", () => this.playNextSongOn(channel));
    await this.sink.play(stream);
  }

  stop(): void {
    this.sink.stop();
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
    if (this.songQueue.length === 0) return "Nothing in the playlist !";
    const queueDetails = await Promise.all(
      this.songQueue.map(async (song) => await this.engine.getDetails(song))
    );
    // @TODO Print the song duration in a human understandable way (currently in seconds)
    const formatSong = (song: SongDetails) =>
      `${song.title} - ${song.author} [${this.secondsToIso(song.duration)}]`;
    // String Builder but it's Javascript :)
    const sb: string[] = [];

    // First check if a song is playing
    if (this.state === JukeboxState.PLAYING) {
      const current = queueDetails[0];
      sb.push(`**Playing** : :musical_note: ${formatSong(current)}`);
    }
    // Then, print each song remaining in the queue
    queueDetails
      // Excluding the one that is currently playing
      .slice(1)
      .forEach((song, index) => sb.push(`${index + 1}) ${formatSong(song)}`));

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
   * Parse a duration in seconds and outputs a HH:MM:SS string
   * @param secs
   * @private
   */
  private secondsToIso(secs: number): string {
    const d = Math.floor(secs / (3600 * 24));
    const h = Math.floor((secs % (3600 * 24)) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor((secs % 3600) % 60);
    const rawArray = [d, h, m, s];
    let i = -1;
    let done = false;
    while (!done) {
      i++;
      if (rawArray[i] !== 0) done = true;
    }
    const formattedArray = rawArray
      .slice(i)
      .map((arg) => (arg > 0 ? String(arg) : "00"));
    if (formattedArray.length === 0) return "00:00";
    // If only seconds, push a "00" to format
    if (formattedArray.length === 1) formattedArray.unshift("00");
    // Map every single digit number in the array to dual digit to format
    return formattedArray
      .map((e) => (e.length === 1 ? `0${e}` : e))
      .join(":")
      .trim();
  }

  //removeSong(): Promise<void>
}
