import { Readable } from "stream";
import { google, youtube_v3 } from "googleapis";
import type { GaxiosResponse } from "gaxios";
import Youtube = youtube_v3.Youtube;
import Schema$SearchListResponse = youtube_v3.Schema$SearchListResponse;
import { IEngine, SongDetails } from "../../@types/jukebox";
import {
  getInfo,
  videoFormat,
  downloadFromInfo,
  videoInfo,
  validateURL,
} from "ytdl-core";
import { opus, FFmpeg } from "prism-media";
import { memoize } from "../../decorators/memoize";
import { inject, injectable } from "inversify";
import { TYPES } from "../../types";

@injectable()
export class YoutubeEngine implements IEngine {
  /** Default Discord sample rate */
  private static readonly DISCORD_SAMPLE_RATE = 48000;
  /** Default Discord audio is stereo */
  private static readonly DISCORD_CHANNEL_COUNT = 2;
  /** Number of bytes to send a a time */
  private static readonly DISCORD_FRAME_SIZE = 960;
  /** A regex to recognize Youtube links*/
  private static readonly LINK_REGEX =
    /^(http(s)?:\/\/)?((w){3}.)?(music\.)?(m\.)?youtu(be|.be)?(\.com)?\/(?!channel).+/;

  constructor(@inject(TYPES.YOUTUBE_API) private yt: Youtube) {}

  /**
   * Given a valid youtube url, returns a Discord-playable stream
   * @param url
   * @returns
   */
  async getPlayableStream(query: string): Promise<Readable> {
    const url = YoutubeEngine.LINK_REGEX.test(query)
      ? query
      : await this.search(query);
    const infos = await this.fetchInfos(url);
    const hasOpusStream =
      infos.formats.find((f) => YoutubeEngine.opusFilter(f)) &&
      infos.videoDetails.lengthSeconds != "0";

    // Waiting for Prism to fix the audio encoder, fallback to direct streaming in
    // any case
    return this.reencodeStreaming(infos);
    /*return hasOpusStream
      ? this.directStreaming(infos)
      : this.reencodeStreaming(infos);*/
  }

  /**
   * Get details on a specific song, by its url
   * @param url
   */
  async getDetails(url: string): Promise<SongDetails> {
    const details = (await this.fetchInfos(url))?.videoDetails;
    return {
      duration: parseInt(details?.lengthSeconds),
      title: details?.title,
      author: details?.author.name,
      description: details?.description,
      image: `https://img.youtube.com/vi/${details?.videoId}/0.jpg`,
      url: url,
    };
  }

  /**
   * Search for the first youtube video matching the query criteria.
   * If the query if a valid url, return the query itself
   * @param query
   * @returns
   */
  async search(query: string): Promise<string> {
    if (YoutubeEngine.LINK_REGEX.test(query)) {
      await this.fetchInfos(query);
      return query;
    }
    const res: GaxiosResponse<Schema$SearchListResponse> =
      await this.yt.search.list({
        part: ["snippet"],
        q: query,
        maxResults: 1,
        type: ["video"],
      });
    if (res?.data?.items?.length === 0) return undefined;

    return `https://www.youtube.com/watch?v=${res.data.items[0].id.videoId}`;
  }

  /**
   * Fetch **and cache** song infos
   * @param url
   * @private
   */
  @memoize()
  private async fetchInfos(url: string): Promise<videoInfo> {
    return await getInfo(url);
  }
  /**
   * Directly stream the video to Discord, without reencoding anything
   * @param infos
   * @returns
   */
  private directStreaming(infos: videoInfo): Readable {
    //const demuxer = new opus.WebmDemuxer();
    return downloadFromInfo(infos, {
      filter: (f) => YoutubeEngine.opusFilter(f),

      // Increasing buffer size to prevent stuttering
      //highWaterMark: 1 << 25,
    })
      //.pipe(demuxer)
      //.on("end", () => demuxer.destroy());
  }

  /**
   * Use FFMpeg to reencode the audio stream to a Discord-compatible format
   * @param infos
   * @returns
   */
  private reencodeStreaming(infos: videoInfo): Readable {
    const bestAudio = YoutubeEngine.bestAudioFormat(infos.formats);
    if (!bestAudio)
      throw new Error(
        `No formats available for song with url : ${infos.baseUrl}`
      );

    const transcoder = new FFmpeg({
      args: YoutubeEngine.getEncodingArgs(bestAudio.url),
    });

    const opusEncoder = new opus.Encoder({
      rate: YoutubeEngine.DISCORD_SAMPLE_RATE,
      channels: YoutubeEngine.DISCORD_CHANNEL_COUNT,
      frameSize: YoutubeEngine.DISCORD_FRAME_SIZE,
    });
    const stream = transcoder.pipe(opusEncoder);
    stream.on("close", () => {
      transcoder.destroy();
      opusEncoder.destroy();
    });
    return stream;
  }

  /**
   * Returns all the FFMPEG args required to transcode any audio to a Discord compatible format
   * @param input
   * @returns args
   */
  private static getEncodingArgs(input: string): string[] {
    return [
      "-reconnect",
      "1",
      "-reconnect_streamed",
      "1",
      "-reconnect_delay_max",
      "5",
      "-reconnect_on_network_error",
      "1",
      "-reconnect_on_http_error",
      "4xx,5xx",
      "-i",
      input,
      "-analyzeduration",
      "0",
      "-loglevel",
      "0",
      "-f",
      "s16le",
      "-ar",
      String(this.DISCORD_SAMPLE_RATE),
      "-ac",
      String(this.DISCORD_CHANNEL_COUNT),
    ];
  }

  /**
   * Returns true if the current format is compatible with a direct Discord stream
   * @param format
   */
  private static opusFilter(format: videoFormat): boolean {
    return (
      format.codecs === "opus" &&
      format.container === "webm" &&
      format.audioSampleRate == String(this.DISCORD_SAMPLE_RATE)
    );
  }

  /**
   * Return the best format available within those presented
   * @param formats
   * @returns
   */
  private static bestAudioFormat(formats: videoFormat[]): videoFormat {
    formats = formats
      .filter((format) => format.audioBitrate)
      .sort((a, b) => b.audioBitrate - a.audioBitrate);
    return formats.find((format) => !format.bitrate) || formats[0];
  }
}
