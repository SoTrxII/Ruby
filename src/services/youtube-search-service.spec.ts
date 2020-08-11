import "reflect-metadata";
import { container } from "../inversify.config";
import { SearchAPI } from "../@types/search-API";
import { TYPES } from "../types";

describe("Youtube service", () => {
  const searchEngine = container.get<SearchAPI>(TYPES.YoutubeService);
  it("Should be able to find any video", async () => {
    const res = await searchEngine.search("ten million voice", 3);
    expect(res.length).toEqual(3);
    console.log(res);
  });
  it("Should return undefined when no results are found", async () => {
    const res = await searchEngine.search(
      "sdqm,,sdjkqsjkjqdsjkqsdjkqsdkjqdsjkjkqdsjkqdsm",
      3
    );
    expect(res).toEqual(undefined);
  });
});