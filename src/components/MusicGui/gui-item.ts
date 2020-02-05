import { EventEmitter } from "events";
import { FfmpegCommand } from "fluent-ffmpeg";
import { Speaker } from "speaker";
import { Readable } from "stream";

enum ItemStates {
  STOPPED = "stopped",
  PLAYING = "playing",
  PAUSED = "paused"
}

export abstract class GuiItem extends EventEmitter {
  static readonly States = ItemStates;
  stream: Readable = undefined;
  speaker: Speaker = undefined;
  ffmpeg: FfmpegCommand = undefined;
  state: ItemStates = GuiItem.States.STOPPED;
  isLooping = false;
  startTime: string = undefined;
  // Set by mute function, backup volume to restore after mute
  volumeBackup: number = undefined;
  volumeStream: any = undefined;

  protected constructor(public track: string) {
    super();
  }

  get volume(): number {
    return this.volumeStream.volume;
  }

  set volume(volume: number) {
    if (isNaN(volume) || volume < 0 || volume > 100) {
      throw new Error(`${volume}is not a valid volume !`);
    }
    this.volumeStream.setVolume(volume / 100);
  }

  /**
   * Returns a readable stream that can be played right away
   */
  abstract createStream(): Readable;

  mute(): boolean {
    if (this.volumeBackup !== undefined) {
      return false;
    }
    this.volumeBackup = this.volume;
    this.volume = 0;
  }

  unmute(): boolean {
    if (this.volumeBackup === undefined) {
      return false;
    }
    this.volume = this.volumeBackup * 100;
    this.volumeBackup = undefined;
  }
}
