import "reflect-metadata";
import "mocha";
import { expect } from "chai";
import { YoutubeSearch } from "./youtube-search";
// eslint-disable-next-line @typescript-eslint/camelcase
import { stub } from "sinon";

describe("YoutubeSearch", () => {
  describe("search", () => {
    before(() => {
      //Needs to be a public memeber of the class to be recognized by stub(), any is a workaround
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      stub(YoutubeSearch, "initializeYoutube" as any).returns({});
    });
    describe("When there is a result", () => {
      const videoId = "OKLM";
      let stubSearchVideos;
      before(() => {
        stubSearchVideos = stub(
          YoutubeSearch.prototype,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "searchVideos" as any
        ).resolves([
          {
            id: {
              videoId: videoId
            }
          }
        ]);
      });
      it("Should return a the video url", async () => {
        const expectedResult = `https://www.youtube.com/watch?v=${videoId}`;
        const ytSearch = new YoutubeSearch();
        const res = await ytSearch.getFirst("dd");
        expect(res).to.equal(expectedResult);
      });
      after(() => {
        stubSearchVideos.restore();
      });
    });

    describe("When there are no results", () => {
      let stubSearchVideos;
      before(() => {
        stubSearchVideos = stub(
          YoutubeSearch.prototype,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "searchVideos" as any
        ).resolves([]);
      });
      it("Should return undefined", async () => {
        const ytSearch = new YoutubeSearch();
        const res = await ytSearch.getFirst("dd");
        expect(res).to.equal(undefined);
      });
      after(() => {
        stubSearchVideos.restore();
      });
    });
    describe("When there is an error on the server side", () => {
      let stubSearchVideos;
      before(() => {
        stubSearchVideos = stub(
          YoutubeSearch.prototype,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          "searchVideos" as any
        ).throws();
      });
      it("Should return undefined", async () => {
        const ytSearch = new YoutubeSearch();
        const res = await ytSearch.getFirst("dd");
        expect(res).to.equal(undefined);
      });
      after(() => {
        stubSearchVideos.restore();
      });
    });
  });
});
