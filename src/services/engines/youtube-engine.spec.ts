import "reflect-metadata";
import { container } from "../../inversify.config";
import { TYPES } from "../../types";
import {  Substitute } from "@fluffy-spoon/substitute";
import { youtube_v3 } from "googleapis";
import Youtube = youtube_v3.Youtube;
import { YoutubeEngine } from "./youtube-engine";
import { OpusEncoder } from "@discordjs/opus";

describe("Youtube Engine", () => {
  let engine: YoutubeEngine;
  const sampleLive = "https://www.youtube.com/watch?v=5qap5aO4i9A";
  const sampleVideo = "https://www.youtube.com/watch?v=FyYDziEB-u4";

  // NOTE : As Ytdl is not a limited API, it is not mocked.
  beforeAll(() => {
    container.snapshot();
    const nullYtApi = Substitute.for<Youtube>();
    container.rebind(TYPES.YOUTUBE_API).toConstantValue(nullYtApi);
  });
  beforeEach(() => {
    engine = container.get(TYPES.ENGINE);
  });
  afterAll(() => {
    container.restore();
  });

  it("Searching an url should returns the url", async () => {
    expect(await engine.search(sampleLive)).toBe(sampleLive);
  });

  it("Searching a string should return the nearest matching url", async () => {
    const sample = "test";
    expect(await engine.search(sample)).toMatch(
      /https:\/\/www\.youtube\.com\/watch\?v=.*videoId/
    );
  });

  it("Get details on a live stream", async () => {
    // Retrieving a live stream duration property shouldn't just "not work"
    // This has to not throw
    expect(await engine.getDetails(sampleLive)).toMatchObject({
      duration: 0,
    });
  }, 20000);

  it("Get details on a video", async () => {
    // Retrieving a live stream duration property shouldn't just "not work"
    // This has to not throw
    expect(await engine.getDetails(sampleVideo)).toMatchObject({
      author: "Wyatt_Flash",
      duration: 16 * 60 + 6,
    });
  }, 20000);

  it.each([
    // Normal video have an opus track, this is direct streaming
    [sampleVideo],
    // Live stream have no opus track by default. Playing a live stream will need re-encoding
    [sampleLive],
  ])(
    "Get a playable stream with %s",
    async (sample) => {
      const stream = await engine.getPlayableStream(sample);
      const enc = new OpusEncoder(48000, 2);
      await new Promise<void>((res) => {
        stream.once("data", (chunk) => {
          enc.decode(chunk);
          res();
        });
      });
    },
    45000
  );
});
