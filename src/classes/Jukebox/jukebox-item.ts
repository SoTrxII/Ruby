import debug0 from "debug";
import { RichEmbed, StreamDispatcher, User, VoiceConnection } from "discord.js";
import { EventEmitter } from "events";
import { GlobalExt } from "../../@types/global";
import {
  secondsToDhms,
  secondsToISOhhmmss
} from "../../utils/duration-converter";
import * as ffmpeg from "fluent-ffmpeg";
import { FfmpegCommand } from "fluent-ffmpeg";
import { Readable, Writable } from "stream";

declare const global: GlobalExt;
const debug = debug0("jukeboxItem");

export interface JukeboxItemInfos {
  title: string;
  author: string;
  description: string;
  image: string;
  url: string;
  duration: number;
}

export abstract class JukeboxItem extends EventEmitter {
  hasBegun = false;
  isPaused = false;
  protected dispatcher: StreamDispatcher = undefined;
  protected ffmpeg: FfmpegCommand = undefined;

  protected constructor(
    public track: string,
    public voiceConnection: VoiceConnection,
    public asker: User
  ) {
    super();
  }

  /**
   * @summary Play the source
   */
  play(options): void {
    this.hasBegun = true;
  }

  /**
   * @summary Resume the playback of the song if possible
   * @returns True if playback was resumed, false otherwise
   */
  resume(): boolean {
    if (this.dispatcher && this.hasBegun && this.isPaused) {
      this.dispatcher.resume();
      this.isPaused = false;

      return true;
    }

    return false;
  }

  /**
   * @summary Pause the playback of the song if possible
   * @returns True if the playback was paused, false otherwise
   */
  pause(): boolean {
    debug(this.hasBegun);
    if (this.dispatcher && this.hasBegun && !this.isPaused) {
      this.dispatcher.pause();
      this.isPaused = true;

      return true;
    }

    return false;
  }

  /**
   * @summary Stops the playback of the song if possible
   * @returns True if the playback was stopped
   */
  stop(): boolean {
    if (this.dispatcher && this.hasBegun) {
      if (this.ffmpeg) {
        this.ffmpeg.kill("SIGKILL");
      }
      this.dispatcher.end();

      return true;
    }

    return false;
  }

  /**
   * @summary Change the playback volume
   */
  setVolume(volume): void {
    this.dispatcher.setVolume(volume);
  }

  /**
   * @summary Change the playback Log volume
   */
  setLogVolume(volume): void {
    this.dispatcher.setVolumeLogarithmic(volume);
  }

  /**
   * @summary Get playback informations
   * @description Try to get all possible infos about the current playback (such as author, length, title...)
   * @return data gathered
   */
  abstract async _getInfo(): Promise<JukeboxItemInfos>;

  /**
   * return a string containing the minimum info about the track
   */
  async toString(): Promise<string> {
    const data = await this._getInfo();
    if (this.dispatcher) {
      return `${data.title} - ${data.author} [ ${secondsToISOhhmmss(
        this.dispatcher.time / 1000
      )} sur ${secondsToISOhhmmss(data.duration)}]`;
    }
    return `${data.title} - ${data.author} [${secondsToDhms(data.duration)}]`;
  }

  /**
   * @summary return an embed corresponding to current playback
   * @returns embed
   */
  async toEmbed(): Promise<RichEmbed> {
    const data = await this._getInfo();
    const em = new RichEmbed();
    const DESC_LIMIT = 100;

    // Song-dependant parameters
    const title = `${data.title || "Inconnu"} [${secondsToDhms(
      data.duration
    )}]`;
    em.setTitle(title);
    em.addField("Auteur", data.author || "Inconnu");

    // 2048 -> desc limit in embed
    let description;
    if (data.description) {
      if (data.description.length > DESC_LIMIT - 1) {
        description = `${data.description.substring(0, DESC_LIMIT - 4)}...`;
      } else {
        description = data.description;
      }
    }
    em.setDescription(description || "Une grosse musique");
    em.setImage(data.image || "");
    em.setURL(data.url || "");

    // Item dependant parameters
    debug(this.constructor.name);
    switch (this.constructor.name) {
      case "JukeboxYoutubeItem":
        em.setThumbnail(
          "https://upload.wikimedia.org/wikipedia/commons/2/2c/Logo_youtube_ios.jpg"
        );
        em.setColor("#E62A21");
        break;
      default:
        break;
    }
    em.setAuthor(this.asker.username, this.asker.displayAvatarURL);

    // Jukebox dependant parameters
    em.setFooter("DJ Ruby ~~", global.Rin.user.displayAvatarURL);
    em.setTimestamp();

    return em;
  }

  protected getNormalizationProcess(
    inStream: Readable,
    outStream: Writable
  ): FfmpegCommand {
    const command = ffmpeg(inStream)
      .on("error", commandLine => {
        debug(`Ffmpeg error : ${commandLine}`);
      })
      .on("stderr", commandLine => {
        debug(`Ffmpeg stderr : ${commandLine}`);
      })
      .audioCodec("aac")
      .format("matroska")
      .addOption("-movflags")
      .addOption("+faststart")
      .noVideo()
      .audioBitrate("192k")
      .addOption("-analyzeduration 0")
      .addOption("-af loudnorm=I=-16:TP=-1.5:LRA=11");
    command.stream(outStream, { end: true });
    return command;
  }
}
