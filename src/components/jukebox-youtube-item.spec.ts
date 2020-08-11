import "reflect-metadata";
import { JukeboxYoutubeItem } from "./jukebox-youtube-item";
import { JukeboxItemAPI } from "../@types/jukebox-item-API";
import { getInfo, videoInfo } from "ytdl-core";
import { mocked } from "ts-jest/utils";
jest.mock("ytdl-core");

describe("Jukebox Item", () => {
  let jukeboxItem: JukeboxItemAPI;
  const TEST_URL = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  beforeEach(() => {
    jukeboxItem = new JukeboxYoutubeItem(TEST_URL);
  });
  it("Should get the item details", async () => {
    const details = await jukeboxItem.getDetails();
    expect(details.duration).toEqual(212);
    expect(details.author).toEqual("RickAstleyVEVO");
    expect(details.title).toEqual(
      "Rick Astley - Never Gonna Give You Up (Video)"
    );
    expect(details.description).toContain(
      "official Rick Astley YouTube channel"
    );
    expect(details.image).toEqual(
      "https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg"
    );
    expect(details.url).toEqual(TEST_URL);
  });
  describe("Cache details", () => {
    let mockedDetailsGetter;
    beforeAll(() => {
      const sampleVideoDetails = {
        videoDetails: {
          lengthSeconds: 212,
          title: "test",
          author: {
            name: "test"
          },
          shortDescription: "test",
          videoId: "test",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        }
      };
      mockedDetailsGetter = mocked(getInfo, true).mockResolvedValue(
        Promise.resolve((sampleVideoDetails as unknown) as videoInfo)
      );
    });
    it("Should cache the details", async () => {
      await jukeboxItem.getDetails();
      expect(mockedDetailsGetter).toHaveBeenCalledTimes(1);
      //Calling the details function again shouldn't called the details getter function again
      //The result should be cached
      await jukeboxItem.getDetails();
      expect(mockedDetailsGetter).toHaveBeenCalledTimes(1);
      await jukeboxItem.getDetails();
      expect(mockedDetailsGetter).toHaveBeenCalledTimes(1);
    });
    afterAll(() => {
      mockedDetailsGetter.restore();
    });
  });
});
