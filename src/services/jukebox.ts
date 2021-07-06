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
    stream.on("end", () => {
      this.songQueue.shift();
      // Execute all user-provided callback when a new song is about to start
      Array.from(this.songStartCbs.values()).forEach((cb) => void cb());
      void this.play(channel);
    });
    await this.sink.play(stream);
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
      `${song.title} - ${song.author} [${song.duration}]`;
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

  //removeSong(): Promise<void>
}
