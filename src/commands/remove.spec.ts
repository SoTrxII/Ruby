import "reflect-metadata";
import { Arg, Substitute } from "@fluffy-spoon/substitute";
import { IJukebox } from "../@types/jukebox";
import { IContext } from "../@types/ruby";
import { Jukebox, JukeboxState } from "../services/jukebox";
import { Pause } from "./pause";
import { SongProgressUi } from "../services/song-progress-ui";
import { Remove } from "./remove";
import {
  ApplicationCommandData,
  Collection,
  CommandInteraction,
  CommandInteractionOption,
} from "discord.js";

describe("Command : Remove", () => {
  it("Wrong argument type", async () => {
    // The jukebox handles the error throwing, this should just handle
    // it without throwing
    const jkb = Substitute.for<IJukebox>();
    const ctx = setContextWithIndex("dsdsds");

    await expect(new Remove(jkb).run(ctx)).resolves.not.toThrow();
  });
  it("Wrong argument value", async () => {
    // The jukebox handles the error throwing, this should just handle
    // it without throwing
    const jkb = Substitute.for<IJukebox>();
    const ctx = setContextWithIndex(-1);

    await expect(new Remove(jkb).run(ctx)).resolves.not.toThrow();
  });
  function setContextWithIndex(index: any) {
    const ctx = Substitute.for<IContext>();
    const args = new Collection<string, CommandInteractionOption>();
    args.set("index", {
      name: "index",
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      value: index,
      type: "INTEGER",
    });
    ctx.getArgs(Arg.any()).returns(args);
    return ctx;
  }
});
