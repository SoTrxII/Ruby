import "reflect-metadata";
import { Stop } from "./stop";
import { Substitute } from "@fluffy-spoon/substitute";
import { IJukebox } from "../@types/jukebox";
import { IContext } from "../@types/ruby";
import { JukeboxState } from "../services/jukebox";

describe("Command : Stop", () => {
  it("Stopping without playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    await new Stop(jkb).run(Substitute.for<IContext>());
    expect(jkb.didNotReceive().stop());
  });
  it("Stopping during playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    jkb.state.returns(JukeboxState.PLAYING);
    await new Stop(jkb).run(Substitute.for<IContext>());
    expect(jkb.received().stop());
  });
});
