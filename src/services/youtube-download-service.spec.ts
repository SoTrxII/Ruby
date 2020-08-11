import "reflect-metadata";
import { container } from "../inversify.config";
import { DownloadAPI } from "../@types/youtube-downloader-API";
import { TYPES } from "../types";
import { createReadStream, createWriteStream, unlinkSync} from "fs";
import { tmpdir } from "os";
import { opus } from "prism-media";
import { createHash } from "crypto";

describe("Youtube Downloader", () => {
  const downloader = container.get<DownloadAPI>(TYPES.YoutubeDownload);
  const outputPath = `${tmpdir()}/opus-${Date.now()}`;

  it("Should download a video compatible with opus", async () => {
    const stream = await downloader.download(
      "https://www.youtube.com/watch?v=86C94bH3jxc"
    );
    const output = createWriteStream(outputPath);
    const decoder = new opus.Decoder({
      rate: 48000,
      channels: 2,
      frameSize: 960
    });
    stream.pipe(decoder).pipe(output);
    await new Promise((res) => {
      stream.on("end", res);
    });
    const sum = await md5FileHash(outputPath);
    expect(sum).toEqual("178f537b11e46544acc4b7f93684bbe6");
  }, 30000);

  afterEach(() => {
    unlinkSync(outputPath);
  });

  async function md5FileHash (path) {
    return new Promise((resolve, reject) => {
      const output = createHash('md5')
      const input = createReadStream(path)

      input.on('error', (err) => {
        reject(err)
      })

      output.once('readable', () => {
        resolve(output.read().toString('hex'))
      })

      input.pipe(output)
    })
  }
});
