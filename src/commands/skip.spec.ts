import "reflect-metadata";
import { Substitute } from "@fluffy-spoon/substitute";
import { IJukebox } from "../@types/jukebox";
import { IContext } from "../@types/ruby";
import { JukeboxState } from "../services/jukebox";
import { Skip } from "./skip";
import type { VoiceChannel } from "discord.js";

describe("Command : Skip", () => {
  it("Skipping when playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    jkb.state.returns(JukeboxState.PLAYING);
    await new Skip(jkb).run(Substitute.for<IContext>());
    expect(jkb.didNotReceive().skip(Substitute.for<VoiceChannel>()));
  });
  it("Skipping when idle", async () => {
    const jkb = Substitute.for<IJukebox>();
    await new Skip(jkb).run(Substitute.for<IContext>());
    expect(jkb.didNotReceive().skip(Substitute.for<VoiceChannel>()));
  });
});
