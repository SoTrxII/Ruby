import "reflect-metadata";
import { Substitute } from "@fluffy-spoon/substitute";
import { IJukebox } from "../@types/jukebox";
import { IContext } from "../@types/ruby";
import { JukeboxState } from "../services/jukebox";
import { Pause } from "./pause";

describe("Command : Pause", () => {
  it("Pausing without playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    await new Pause(jkb).run(Substitute.for<IContext>());
    expect(jkb.didNotReceive().pause());
  });
  it("Pausing during playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    jkb.state.returns(JukeboxState.PLAYING);
    await new Pause(jkb).run(Substitute.for<IContext>());
    expect(jkb.received().pause());
  });
});
