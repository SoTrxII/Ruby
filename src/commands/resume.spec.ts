import "reflect-metadata";
import { Substitute } from "@fluffy-spoon/substitute";
import { IJukebox } from "../@types/jukebox";
import { IContext } from "../@types/ruby";
import { JukeboxState } from "../services/jukebox";
import {Resume} from "./resume";

describe("Command : Resume", () => {
    it("Resuming when paused", async () => {
        const jkb = Substitute.for<IJukebox>();
        jkb.state.returns(JukeboxState.PAUSED);
        await new Resume(jkb).run(Substitute.for<IContext>());
        expect(jkb.received().resume());
    });
    it("Resuming during playing", async () => {
        const jkb = Substitute.for<IJukebox>();
        jkb.state.returns(JukeboxState.PLAYING);
        await new Resume(jkb).run(Substitute.for<IContext>());
        expect(jkb.didNotReceive().resume());
    });
    it("Resuming when idle", async () => {
        const jkb = Substitute.for<IJukebox>();
        await new Resume(jkb).run(Substitute.for<IContext>());
        expect(jkb.didNotReceive().resume());
    });
});
