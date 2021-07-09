import "reflect-metadata";
import { Substitute } from "@fluffy-spoon/substitute";
import { IJukebox } from "../@types/jukebox";
import { IContext } from "../@types/ruby";
import { JukeboxState } from "../services/jukebox";
import { Resume } from "./resume";
import { SongProgressUi } from "../services/song-progress-ui";

describe("Command : Resume", () => {
  it("Resuming when paused", async () => {
    const jkb = Substitute.for<IJukebox>();
    jkb.state.returns(JukeboxState.PAUSED);
    const spui = Substitute.for<SongProgressUi>();
    await new Resume(jkb, spui).run(Substitute.for<IContext>());
    expect(jkb.received().resume());
    expect(spui.received().resume());
  });
  it("Resuming during playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    jkb.state.returns(JukeboxState.PLAYING);
    const spui = Substitute.for<SongProgressUi>();

    await new Resume(jkb, spui).run(Substitute.for<IContext>());
    expect(jkb.didNotReceive().resume());
    expect(spui.didNotReceive().resume());
  });
  it("Resuming when idle", async () => {
    const jkb = Substitute.for<IJukebox>();
    const spui = Substitute.for<SongProgressUi>();
    await new Resume(jkb, spui).run(Substitute.for<IContext>());
    expect(jkb.didNotReceive().resume());
    expect(spui.didNotReceive().resume());
  });
});
