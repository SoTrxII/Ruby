import "reflect-metadata"
import AddSong from "./add-song";
import { CommandoClient } from "discord.js-commando";
import { InvalidQueryError, Jukebox } from "../components/jukebox";

jest.mock("discord.js-commando");
describe("Command: Add song", () => {
  const command = new AddSong(CommandoClient);
  const messageStack = []
  const mockedMessage = {
    say: message => messageStack.push(message)
  };
  let addSongSpy;
  beforeAll(() => {
    addSongSpy = jest
      .spyOn(Jukebox.prototype, "addSong")
      .mockImplementation(() => {
        throw new InvalidQueryError();
      });
  });
  it("Should catch any throwed error", () => {
    command.run(mockedMessage, {
      query: "whatever"
    });
    console.log(messageStack);
    expect(messageStack.pop()).toContain("Aucune musique")
  });
  afterAll(() => {
    addSongSpy.restore();
  });
});
