import debug0 from "debug";
import { TextChannel, VoiceConnection } from "discord.js";
import { EventEmitter } from "events";
import * as ffmpeg from "fluent-ffmpeg";
import Volume from "pcm-volume";
import Speaker from "speaker";
import { PassThrough, pipeline, Readable, Writable } from "stream";
import { GuiItem } from "./gui-item";
import { GuiItemFactory } from "./gui-item-factory";

const debug = debug0("musicGui");

export class MusicGui extends EventEmitter {
  /**
   * List of music that can be played
   */
  private songs: Map<string, GuiItem> = new Map();
  /**
   * audio stream coming from the main audio card
   */
  private audioLoop = new PassThrough();

  /**
   * Command extracting audio samples from the main audio card
   */
  private audioCommand: ffmpeg.FfmpegCommand;

  /**
   * Playback timer of current song
   */
  private timemark: string = undefined;

  constructor(
    public voiceConnection: VoiceConnection,
    public textChannel: TextChannel
  ) {
    super();

    this.audioCommand = ffmpeg()
      .on("start", commandLine => {
        debug(`Spawned Ffmpeg with command: ${commandLine}`);
      })
      .once("progress", () => {
        this.startLink();
      })
      .input("0")
      .inputFormat("pulse")
      .outputFormat("s16le")
      .addOption("-analyzeduration 0")
      .audioCodec("pcm_s16le")
      .audioBitrate("64k")
      .output(this.audioLoop, { end: false });

    this.audioCommand.run();

    this.on("songEnd", this._endHandler);
  }

  get allTracks(): Array<string> {
    return Array.from(this.songs.values()).map(s => s.track);
  }

  /**
   * Trigerred each time a song end, check if the song
   * has to be relooped
   * @param id Song's id
   */
  _endHandler(id: string): void {
    const song = this.songs.get(id);
    if (song === undefined) {
      console.error("[WTF] The song that just ended doesn't exists ?");

      return;
    }
    if (song.isLooping) {
      this.stopSong(id);
      this.playSong(id);
    }
  }

  /**
   * Return the time elapsed for a song in seconds
   * @param id Song's id
   */
  getCurrentTimeInSeconds(id: string): number {
    const song = this.songs.get(id);
    if (song === undefined) {
      return undefined;
    }
    if (song.state === GuiItem.States.STOPPED) {
      return 0;
    }

    return (
      this.hmsToSecondsOnly(this.timemark) +
      this.hmsToSecondsOnly(song.startTime)
    );
  }

  hmsToSecondsOnly(str: string): number {
    const p = str.split(":");
    // tslint:disable-next-line:one-variable-per-declaration
    let s = 0,
      m = 1;

    while (p.length > 0) {
      s += m * parseInt(p.pop(), 10);
      m *= 60;
    }

    return s;
  }

  /**
   * Add a song to the available list
   * @param link Link of music to play
   * @return id of the song or null the song couldn't be added
   */
  addSong(link: string): string {
    const id = this._generateId();
    const item = GuiItemFactory.createItem(link);
    // Item fitting the link couldn't be found
    if (item === undefined) {
      return undefined;
    }
    this.songs.set(id, item);

    return id;
  }

  /**
   * Set a song in a looping state, playing it until it's stopped
   * @param id id of the song to play
   */
  loopSong(id: string): boolean {
    const song = this.songs.get(id);
    if (song === undefined) {
      return false;
    }
    song.isLooping = true;

    return true;
  }

  /**
   * Remove the song looping state
   * @param id id of the song to play
   */
  unloopSong(id: string): boolean {
    const song = this.songs.get(id);
    if (song === undefined) {
      return false;
    }
    song.isLooping = false;

    return true;
  }

  /**
   * Build the command to transform any
   * readable stream into a pure PCM stream
   * @param input Base stream to process
   * @param startTime Offset to begin stream
   * @param outStream Where to pipe he PCM stream into
   * @param id Song's id
   * @returns FFmpeg command
   */
  _buildFfmpegCommand(
    input: Readable,
    startTime: string,
    outStream: Writable,
    id: string
  ): ffmpeg.FfmpegCommand {
    const command = ffmpeg(input)
      .on("start", commandLine => {
        debug(`Spawned video Ffmpeg with command: ${commandLine}`);
      })
      .on("error", commandLine => {
        console.error(`Ffmpeg error : ${commandLine}`);
      })
      .on("progress", progress => {
        debug(progress);
        this.timemark = progress.timemark;
        this.emit(`songProgress${id}`);
        // es(command);
      })
      .on("end", () => {
        this.emit("songEnd", id);
      })
      .audioCodec("pcm_s16le")
      .format("s16le")
      .addOption("-map 0:a")
      .addOption("-strict -2")
      .addOption("-analyzeduration 0")
      // .preset("ultrafast")
      .audioFrequency(48000)
      .audioBitrate("64k");
    if (startTime) {
      command.seekInput(startTime);
    }
    command.stream(outStream);

    return command;
  }

  /**
   * Play the song identified by id, either PAUSED or STOPPED
   * @param id Song's id
   * @param startTime Offset to start with
   * @param volume volume to pay the song with
   */
  playSong(id: string, startTime?: string, volume = 1): boolean {
    const song = this.songs.get(id);
    if (song === undefined) {
      return false;
    }
    if (song.state === GuiItem.States.PAUSED) {
      song.unmute();
      // Make process continue
      song.ffmpeg.kill("SIGCONT");
      song.state = GuiItem.States.PLAYING;
    } else if (song.state === GuiItem.States.STOPPED) {
      song.speaker = new Speaker({
        channels: 2,
        bitDepth: 16,
        sampleRate: 48000,
        // "signed" is a valid property, but not documented in the types
        // tslint:disable-next-line:ban-ts-ignore
        // @ts-ignore
        signed: true,
        // samplesPerFrame: 1024,
        device: "pulse" // this._config.hardwareOutput || `hw:0,0,1`
      });
      song.speaker.on("error", err => {
        debug(err);
      });
      const musicStream = new PassThrough();
      song.startTime = startTime;
      song.ffmpeg = this._buildFfmpegCommand(
        song.stream,
        startTime,
        musicStream,
        id
      );
      song.volumeStream = new Volume(volume);
      pipeline(musicStream, song.volumeStream, song.speaker);
      song.state = GuiItem.States.PLAYING;
    } else {
      return false;
    }
  }

  /**
   * Stops the song from playing and clean up the mess
   * @param id song's id
   */
  stopSong(id: string): boolean {
    const song = this.songs.get(id);
    if (song === undefined || song.state === GuiItem.States.STOPPED) {
      debug("Song already stopped !");

      return false;
    }
    try {
      song.speaker.close(false);
    } catch (e) {
      //
    }

    song.ffmpeg.kill("SIGKILL");
    song.ffmpeg.on("error", () => {
      debug(`FFMPEG for song ${id} has been successfully killed`);
    });
    song.ffmpeg = undefined;
    song.speaker = undefined;
    song.volumeStream = undefined;
    // Regenerate stream
    song.createStream();
    song.state = GuiItem.States.STOPPED;

    return true;
  }

  /**
   * Forward the song to a specific time
   */
  async fetchTime(id: string, time: string): Promise<any> {
    const song = this.songs.get(id);
    if (song === undefined) {
      return false;
    }
    const oldVolume = song.volume;
    if (song.state !== GuiItem.States.STOPPED) {
      this.stopSong(id);
    }
    // tslint:disable-next-line:no-this-assignment
    const that = this;
    const progressProm = new Promise((res, rej) => {
      that.on(`songProgress${id}`, () => {
        res(true);
      });
    });
    this.playSong(id, time, oldVolume);

    return progressProm;
  }

  /**
   * Set a specific song loudness
   * @param id song's if
   * @param volume loudness in %
   * @returns false if song doesn't exists
   */
  setSongVolume(id: string, volume: number): boolean {
    const song = this.songs.get(id);
    if (song === undefined) {
      return false;
    }
    try {
      song.volume = volume;
    } catch (err) {
      debug("Invalid volume");

      return false;
    }

    return true;
  }

  /**
   * Pause a currently playing song
   * @param id Song id
   */
  pauseSong(id: string): boolean {
    const song = this.songs.get(id);
    if (song === undefined || song.state !== GuiItem.States.PLAYING) {
      debug("Cannot pause a song that isn't playing !");

      return false;
    }
    // Suspending the process takes actually
    // quite a lot of time (a few seconds), so we mute the stream before
    // so the user can obtain the same result
    song.mute();
    // equiv CTRL-Z, suspend process
    song.ffmpeg.kill("SIGSTOP");
    song.state = GuiItem.States.PAUSED;

    return true;
  }

  /**
   * @param id Song identifier
   * @returns True if deleted, false if not found
   */
  removeSong(id: string): boolean {
    const song = this.songs.has(id);
    if (!song) {
      return false;
    }
    this.stopSong(id);
    this.songs.delete(id);
  }

  /**
   * Generate a random id
   */
  _generateId(): string {
    return (
      // tslint:disable-next-line:newline-per-chained-call
      Math.random()
        .toString(36)
        .substring(2, 15) +
      // tslint:disable-next-line:newline-per-chained-call
      Math.random()
        .toString(36)
        .substring(2, 15)
    );
  }

  /**
   * Start to link the audio card output to discord input
   */
  startLink(): void {
    this.voiceConnection.playConvertedStream(this.audioLoop, {
      bitrate: 48000,
      passes: 1
    });
  }

  reset(): void {
    Array.from(this.songs.keys()).forEach(id => this.stopSong(id));
    this.songs = new Map();
  }
}
