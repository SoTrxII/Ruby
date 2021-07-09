import type { Readable } from "stream";
import type { StreamType, VoiceConnection } from "@discordjs/voice";
import type { VoiceChannel } from "discord.js";
import { AudioPlayer, AudioPlayerStatus } from "@discordjs/voice";
import { JukeboxState } from "../services/jukebox";

export interface IJukebox {
  /** Add a new song to play to the bottom of the song queue.
   * If the query is a valid url for the engine, it is added directly.
   * Otherwise the search function of the engine is used to get a matching url
   * */
  addSong(query: string): Promise<void>;

  /**
   * Begin playing into the provided audio sink
   * @param channel voice channel to play into
   */
  play(channel: VoiceChannel): Promise<void>;

  /**
   * Stops the playback
   */
  stop(): void;

  /**
   * Pauses the playback
   */
  pause(): void;

  /**
   * Resumes the playback after a pause
   */
  resume(): void;

  /**
   * Skip to the next song in the playlist
   * @param channel
   */
  skip(channel: VoiceChannel): void;

  /**
   * Get currently playing song
   */
  getCurrent(): Promise<SongDetails>;

  /** Current playing state */
  readonly state: JukeboxState;

  /** Time waiting before leaving a voice channel when there's nothing more to play */
  readonly leavingWait: string;

  /**
   * Get a print ready version of the song queue.
   * A warning message is returned if the queue is empty
   */
  getPrettyQueue(): Promise<string>;

  /** Add a callback executed when a new song starts.
   * @param id unique identifier on the callback. This allows to not add the same callback twice
   * @param handler callback
   * */
  onSongStart(id: string, handler: SongCallback): void;

  /** Add a callback executed when the playlist is empty
   * @param id unique identifier on the callback. This allows to not add the same callback twice
   * @param handler callback
   * */
  onPlaylistEmpty(id: string, handler: SongCallback): void;
}
type SongCallback = () => Promise<void>;
/**
 * Details on a requested song
 */
export interface SongDetails {
  /** Duration of the song, in seconds*/
  duration: number;
  /** Title of the song */
  title: string;
  /** Author. More accurately, in most engine, this will be the uploader */
  author: string;
  /** Associated description. Video description on vod website,
   *  author details on song streaming websites
   */
  description?: string;
  /** Song associated image / Thumbnail */
  image?: string;
  /** Direct url to the song */
  url: string;
}
/**
 * Search engine for the Jubebox
 */
export interface IEngine {
  /**
   * Get a playable stream for a specific search
   * @param query
   */
  getPlayableStream(query: string): Promise<Readable>;

  /**
   * Search for the first youtube video matching the query criteria.
   * If the query if a valid url, return the query itself
   * @param query
   * @returns
   */
  search(query: string): Promise<string>;

  /**
   * Get details on a specific song, by its url
   * @param url
   */
  getDetails(url: string): Promise<SongDetails>;
}

/**
 * Where to send the voice packets to
 */
export interface ISink {
  play(
    stream: Readable,
    opt = { inputType: StreamType.Opus }
  ): Promise<AudioPlayer>;

  /**
   * Pause the playing stream. Throws if the player is not playing.
   */
  pause(): void;

  /**
   * Resume the paused stream. Throws if the player is not paused.
   */
  resume(): void;

  /**
   * Stops the playing stream
   */
  stop(): void;

  /**
   * Attempt to join the provided voice channel. Throws on errors
   * @param channel
   */
  joinVoiceChannel(channel: VoiceChannel): Promise<VoiceConnection>;

  /**
   * Leave the provided voice channel
   * @param channel
   */
  leaveVoiceChannel(channel: VoiceChannel): void;

  /**
   * Get the current status (playing/paused/stopped) of the player
   */
  readonly state: AudioPlayerStatus;
}
