import "reflect-metadata";
import { Substitute } from "@fluffy-spoon/substitute";
import { IJukebox } from "../@types/jukebox";
import { IContext } from "../@types/ruby";
import { JukeboxState } from "../services/jukebox";
import { Pause } from "./pause";
import {SongProgressUi} from "../services/song-progress-ui";

describe("Command : Pause", () => {
  it("Pausing without playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    const spui = Substitute.for<SongProgressUi>();
    await new Pause(jkb, spui).run(Substitute.for<IContext>());
    expect(jkb.didNotReceive().pause());
    expect(spui.didNotReceive().pause());
  });
  it("Pausing during playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    jkb.state.returns(JukeboxState.PLAYING)
    const spui = Substitute.for<SongProgressUi>();
    await new Pause(jkb, spui).run(Substitute.for<IContext>());
    expect(jkb.received().pause());
    expect(spui.received().pause());
  });
});
