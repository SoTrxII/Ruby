import "reflect-metadata";
import { DiscordSink } from "./discord-sink";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { Arg, Substitute } from "@fluffy-spoon/substitute";
import { Readable } from "stream";
import type * as dVoice from "@discordjs/voice";
import { AudioPlayerStatus, VoiceConnection } from "@discordjs/voice";
import type { VoiceChannel } from "discord.js";

describe("Discord Sink", () => {
  let sink: DiscordSink;
  const dVoiceSub = Substitute.for<typeof dVoice>();

  beforeAll(() => {
    container.snapshot();
    container.rebind(TYPES.DJS_VOICE).toConstantValue(dVoiceSub);
    container.rebind(TYPES.AUDIO_SINK).to(DiscordSink);
  });

  beforeEach(() => (sink = container.get(TYPES.AUDIO_SINK)));

  afterAll(() => {
    container.restore();
  });

  it("Play stream on the sink", async () => {
    // The best way to test this is to actually fake a stream having no beginning
    // so that the Audio Player detects it
    await expect(sink.play(Substitute.for<Readable>())).resolves.not.toThrow();
  });

  it("Join a voice channel", async () => {
    // This must work in "any" situation. we don't really need spies to check that it worked.
    await expect(
      sink.joinVoiceChannel(Substitute.for<VoiceChannel>())
    ).resolves.not.toThrow();
  });

  it("Leave a voice channel", () => {
    // This must work in "any" situation. we don't really need spies to check that it worked.
    expect(() =>
      sink.leaveVoiceChannel(Substitute.for<VoiceChannel>())
    ).not.toThrow();
  });

  // For each possible state of the audio player, verify that we are handling that correctly
  describe.each([
    AudioPlayerStatus.Playing,
    AudioPlayerStatus.Paused,
    AudioPlayerStatus.Idle,
    AudioPlayerStatus.AutoPaused,
    AudioPlayerStatus.Buffering,
  ])("Sanity checking the basic methods", (targetStatus) => {
    let sink: DiscordSink;
    beforeEach(() => {
      // For this, we need to go deep in the code hierarchy
      // We need the discordJs Framework...
      const sub = Substitute.for<typeof dVoice>();
      // which has an audio player...
      const subPlayer = Substitute.for<dVoice.AudioPlayer>();
      // which itself has a state...
      const subPlayerState = Substitute.for<dVoice.AudioPlayerState>();
      // to return a specific value
      subPlayerState.status.returns(targetStatus);
      // And now we can go backward and stack up the mocks
      subPlayer.state.returns(subPlayerState);
      sub.createAudioPlayer(Arg.all()).returns(subPlayer);
      // Make the mock behave itself like the real thing when comparing Audio status
      sub.AudioPlayerStatus.mimicks(() => AudioPlayerStatus);
      // And register all this in our DI container
      container.rebind(TYPES.DJS_VOICE).toConstantValue(sub);
      container.rebind(TYPES.AUDIO_SINK).to(DiscordSink);
      sink = container.get(TYPES.AUDIO_SINK);
    });

    // Delete custom mocks
    afterAll(() => {
      container
        .rebind(TYPES.DJS_VOICE)
        .toConstantValue(Substitute.for<typeof dVoice>());
      container.rebind(TYPES.AUDIO_SINK).to(DiscordSink);
    });

    it(`Pausing when state is ${targetStatus}`, () => {
      // Pausing when no playing should lead to an error
      if (targetStatus !== AudioPlayerStatus.Playing) {
        expect(() => sink.pause()).toThrow();
      } else expect(() => sink.pause()).not.toThrow();
    });

    it(`Stopping when state is ${targetStatus}`, () => {
      // We can actually stop in any state
      expect(() => sink.stop()).not.toThrow();
    });

    it(`Resuming when state is ${targetStatus}`, () => {
      // Resuming should only be ok when the playback is paused
      if (targetStatus !== AudioPlayerStatus.Paused) {
        expect(() => sink.resume()).toThrow();
      } else expect(() => sink.resume()).not.toThrow();
    });

    it(`Playing when state is ${targetStatus}`, async () => {
      // We can actually play inn any state, this will just reset the player timer
      await expect(
        sink.play(Substitute.for<Readable>())
      ).resolves.not.toThrow();
    });
  });
});
