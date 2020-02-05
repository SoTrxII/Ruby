import "reflect-metadata";
import "mocha";
import { getHelpString, getValids } from "./command-handle";
import { expect } from "chai";
describe("CommandHandle", () => {
  describe("Split into link and text", () => {
    it("Should return nothing is there is no command line argument", () => {
      const voidArg = undefined;
      const validArgs = getValids(voidArg);
      expect(validArgs).to.eql([]);
    });

    it("Should parse text only", () => {
      const cmdArg = "jhdkshkdshjds dsdsdssdsds";
      const validArgs = getValids(cmdArg);
      expect(validArgs).to.eql(["jhdkshkdshjds dsdsdssdsds"]);
    });

    it("Should parse links only", () => {
      const cmdArg =
        "https://www.youtube.com/watch?v=TiEGVgYTXKo  https://www.youtube.com/watch?v=TiEGVgYTXKo";
      const validArgs = getValids(cmdArg);
      expect(validArgs).to.eql([
        "https://www.youtube.com/watch?v=TiEGVgYTXKo",
        "https://www.youtube.com/watch?v=TiEGVgYTXKo"
      ]);
    });

    it("Should parse mixed text and link", () => {
      const cmdArg =
        "https://www.youtube.com/watch?v=TiEGVgYTXKo wdwddwwd wdvwdwdg https://www.youtube.com/watch?v=TiEGVgYTXKo";
      const validArgs = getValids(cmdArg);
      expect(validArgs).to.eql([
        "https://www.youtube.com/watch?v=TiEGVgYTXKo",
        "wdwddwwd wdvwdwdg",
        "https://www.youtube.com/watch?v=TiEGVgYTXKo"
      ]);
    });

    it("Should ignore any extra spaces", () => {
      const cmdArg =
        "https://www.youtube.com/watch?v=TiEGVgYTXKo        https://www.youtube.com/watch?v=TiEGVgYTXKo";
      const validArgs = getValids(cmdArg);
      expect(validArgs).to.eql([
        "https://www.youtube.com/watch?v=TiEGVgYTXKo",
        "https://www.youtube.com/watch?v=TiEGVgYTXKo"
      ]);
    });
  });
  describe("Help", () => {
    it("Should be able to build the help string", () => {
      expect(getHelpString).to.not.throw();
      const helpStr = getHelpString();
      expect(helpStr).to.not.equal(undefined);
    });
  });
});
