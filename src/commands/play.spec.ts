import "reflect-metadata";
import {Arg, Substitute} from "@fluffy-spoon/substitute";
import { IJukebox } from "../@types/jukebox";
import { IContext } from "../@types/ruby";
import { JukeboxState } from "../services/jukebox";
import { Play } from "./play";
import { SongProgressUi } from "../services/song-progress-ui";
import type { VoiceChannel } from "discord.js";

describe("Command : Play", () => {
  it("Playing when paused", async () => {
    const jkb = Substitute.for<IJukebox>();
    const ui = Substitute.for<SongProgressUi>();
    jkb.state.returns(JukeboxState.PAUSED);
    await new Play(jkb, ui).run(Substitute.for<IContext>());
    expect(jkb.received().play);
  });
  it("Playing during playing", async () => {
    const jkb = Substitute.for<IJukebox>();
    const ui = Substitute.for<SongProgressUi>();
    jkb.state.returns(JukeboxState.PLAYING);
    await new Play(jkb, ui).run(Substitute.for<IContext>());
    expect(jkb.didNotReceive().play);
  });
  it("Playing when idle", async () => {
    const jkb = Substitute.for<IJukebox>();
    const ui = Substitute.for<SongProgressUi>();
    await new Play(jkb, ui).run(Substitute.for<IContext>());
    expect(jkb.received().play);
  });
});
