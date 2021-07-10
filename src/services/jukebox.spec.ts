import "reflect-metadata";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { Arg, Substitute } from "@fluffy-spoon/substitute";
import { IEngine, IJukebox, ISink } from "../@types/jukebox";
import { Jukebox } from "./jukebox";
import type { VoiceChannel } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";

describe("Jukebox", () => {
  let jukebox: IJukebox;
  const nullEngine = Substitute.for<IEngine>();
  let nullSink = Substitute.for<ISink>();
  const bUrl = "https://basic-url.com";
  const bSong = {
    url: bUrl,
    description: " blah",
    author: "test",
    duration: 1,
    title: "test",
  };
  beforeAll(() => {
    // Saving di container state before using all the mocks
    container.snapshot();
    // Mocking Jukebox search engine
    nullEngine.search("test").resolves(bUrl);
    nullEngine.getDetails(bUrl).resolves(bSong);
    container.rebind(TYPES.ENGINE).toConstantValue(nullEngine);
    // And also mocking Jukebox audio sink
    resetNullSink();
    container.rebind(TYPES.AUDIO_SINK).toConstantValue(nullSink);
    // In the base container, Jukebox is bound in a singleton scope.
    // This means that even if we change the engine and sink, the existing
    // instance will not sue the mock. We must rebind Jukebox for it to happen
    container.rebind(TYPES.JUKEBOX).to(Jukebox);
  });
  // Reset the jukebox before every test
  beforeEach(() => {
    jukebox = container.get(TYPES.JUKEBOX);
  });
  afterAll(() => {
    container.restore();
  });
  it("Adding a song and retrieving it", async () => {
    // This shouldn't throw
    expect(await jukebox.getCurrent()).toBeUndefined();
    await jukebox.addSong("test");
    const url = await jukebox.getCurrent();
    expect(url).toBe(bSong);
  });

  it("Adding a song with custom info", async () => {
    // This shouldn't throw
    expect(await jukebox.getCurrent()).toBeUndefined();
    await jukebox.addSong("test", { requester: "test user" });
    const url = await jukebox.getCurrent();
    expect(url).toBe(Object.assign(bSong, { requester: "test user" }));
  });

  it("Printing a pretty queue", async () => {
    expect(await jukebox.getPrettyQueue()).toMatch(/Nothing.*/i);
    // The jukebox isn't playing, so there should be no playing song
    await jukebox.addSong("test");
    expect(await jukebox.getPrettyQueue()).toMatch(/^1\) test.*/i);
  });

  it("Playing with songs in the queue", async () => {
    await jukebox.addSong("test");
    await jukebox.play(Substitute.for<VoiceChannel>());
    expect(nullSink.received().play(Arg.all()));
  });

  it("Stopping while not playing", async () => {
    await jukebox.stop();
    expect(nullSink.didNotReceive().stop());
  });

  describe("While playing...", () => {
    beforeAll(() => {
      // Simulate we are playing something
      nullSink.state.returns(AudioPlayerStatus.Playing);
    });

    afterAll(() => {
      // Resetting null sink, as we changed its behaviour
      resetNullSink();
    });

    it("Stop", async () => {
      await jukebox.stop();
      expect(nullSink.received().stop());
    });
    it("Skip", () => {
      jukebox.skip(Substitute.for<VoiceChannel>());
      expect(nullSink.received().stop());
    });
    it("Pause && Resume", () => {
      jukebox.pause();
      expect(nullSink.received().pause());
      jukebox.resume();
      expect(nullSink.received().resume());
    });
  });
  function resetNullSink() {
    nullSink = Substitute.for<ISink>();
    nullSink.play(Arg.all()).resolves(undefined);
    nullSink.stop().returns(undefined);
    nullSink.pause().returns(undefined);
    nullSink.resume().returns(undefined);
  }
});
