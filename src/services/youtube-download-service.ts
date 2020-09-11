import {
  getInfo,
  downloadFromInfo,
  videoFormat,
  downloadOptions,
  videoInfo,
} from "ytdl-core";
import { opus, FFmpeg } from "prism-media";
import { DownloadAPI } from "../@types/youtube-downloader-API";
import { Readable } from "stream";
import { injectable } from "inversify";
import { memoize } from "../decorators/memoize";

export class NoFormatAvailableError extends Error {}
/**
 * Provides an optimization over classic ytdl by trying to use a direct OPUS stream without re-encoding
 */
@injectable()
export class YoutubeDownloadService implements DownloadAPI {
  private static readonly defaultYtdlOptions: downloadOptions = {
    highWaterMark: 1 << 25,
  };
  private static getEncodingArgs(input: string): string[] {
    return [
      "-reconnect",
      "1",
      "-reconnect_streamed",
      "1",
      "-reconnect_delay_max",
      "5",
      "-i",
      input,
      "-analyzeduration",
      "0",
      "-loglevel",
      "0",
      "-f",
      "s16le",
      "-ar",
      "48000",
      "-ac",
      "2",
    ];
  }

  /**
   * Returns true if the current format is compatible with a direct Discord stream
   * @param format
   */
  private static opusFilter(format): boolean {
    return (
      format.codecs === "opus" &&
      format.container === "webm" &&
      format.audioSampleRate == "48000"
    );
  }

  private static bestAudioFormat(formats: videoFormat[]): videoFormat {
    formats = formats
      .filter((format) => format.audioBitrate)
      .sort((a, b) => b.audioBitrate - a.audioBitrate);
    return formats.find((format) => !format.bitrate) || formats[0];
  }
  async download(
    url: string,
    options: downloadOptions = {}
  ): Promise<Readable> {
    Object.assign(options, YoutubeDownloadService.defaultYtdlOptions);
    const infos = await getInfo(url);
    const format = infos.formats.find(YoutubeDownloadService.opusFilter);
    const hasOpusStream = format && infos.videoDetails.lengthSeconds != "0";
    if (hasOpusStream) {
      options = { ...options, filter: YoutubeDownloadService.opusFilter };
      const demuxer = new opus.WebmDemuxer();
      return downloadFromInfo(infos, options)
        .pipe(demuxer)
        .on("end", () => demuxer.destroy());
    } else {
      const bestAudio = YoutubeDownloadService.bestAudioFormat(infos.formats);
      if (!bestAudio)
        throw new NoFormatAvailableError(
          `No formats available for song with url : ${url}`
        );

      const transcoder = new FFmpeg({
        args: YoutubeDownloadService.getEncodingArgs(bestAudio.url),
      });
      const opusEncoder = new opus.Encoder({
        rate: 48000,
        channels: 2,
        frameSize: 960,
      });
      const stream = transcoder.pipe(opusEncoder);
      stream.on("close", () => {
        transcoder.destroy();
        opusEncoder.destroy();
      });
      return stream;
    }
  }

  @memoize()
  async getInfo(url: string): Promise<videoInfo> {
    return getInfo(url);
  }
}
