import "reflect-metadata";
import "mocha";
import { TYPES } from "../src/types";
import { expect } from "chai";
import { SearchService } from "../src/classes/Search/search-service";
import { YoutubeSearch } from "../src/classes/Search/youtube-search";
import container from "../src/inversify.config";
import { Jukebox } from "../src/classes/Jukebox/jukebox";
import { VoiceConnection, TextChannel, User, ClientUser } from "discord.js";
import { mock, spy, stub, createStubInstance } from "sinon";
import sinon = require("sinon");
import { JukeboxItemFactory } from "../src/classes/Jukebox/jukebox-item-factory";

describe("Jukebox", () => {
  let jukebox: Jukebox;
  const mockLink = "https://www.youtube.com/watch?v=lAIGb1lfpBw";
  container.rebind<SearchService>(TYPES.SearchServices).toConstantValue(
    createStubInstance(YoutubeSearch, {
      getFirst: Promise.resolve(mockLink)
    })
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sampleUser: User = (mock(User) as any) as User;
  const firstLink = "https://www.youtube.com/watch?v=J7Iz5060PUE";
  const secondLink = "https://www.youtube.com/watch?v=wZZ7oFKsKzY";
  const setupPlayingState = async (): Promise<void> => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeClientUser = (mock(ClientUser.prototype) as any) as ClientUser;
    fakeClientUser.setActivity = stub().returns(null);
    // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
    // @ts-ignore
    jukebox.voiceConnection.client = {
      user: fakeClientUser
    };
    jukebox.voiceConnection.playStream = stub().returns({
      on: () => null,
      end: () => null
    });
    await jukebox.addMusic(firstLink, sampleUser);
    await jukebox.addMusic(secondLink, sampleUser);
  };
  beforeEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeVc = (mock(VoiceConnection) as any) as VoiceConnection;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fakeTc = (mock(TextChannel) as any) as TextChannel;
    jukebox = new Jukebox(fakeVc, fakeTc);
  });
  describe("Add a new music", () => {
    describe("Youtube music", () => {
      it("Should add a valid youtube link", async () => {
        const validLink = "https://www.youtube.com/watch?v=J7Iz5060PUE";
        const res = await jukebox.addMusic(validLink, sampleUser);
        expect(res).to.equal(true);
        expect(jukebox.numberOfSongs).to.equal(1);
      });

      it("Should ignore playlist on valid link", async () => {
        const validLink =
          "https://www.youtube.com/watch?v=J7Iz5060PUE&list=RDCLAK5uy_k-R9-M_MoPNXLwGQrxPQW9LavsOgSwONg";
        const res = await jukebox.addMusic(validLink, sampleUser);
        expect(res).to.equal(true);
        expect(jukebox.numberOfSongs).to.equal(1);
      });

      it("Should add a valid youtube music link", async () => {
        const validLink = "https://music.youtube.com/watch?v=vtNJMAyeP0s";
        const res = await jukebox.addMusic(validLink, sampleUser);
        expect(res).to.equal(true);
        expect(jukebox.numberOfSongs).to.equal(1);
      });
      it("Should reject channel links", async () => {
        JukeboxItemFactory.setTextSearchEnabled(false);
        const invalidLink =
          "https://youtube.com/channel/UCDZkgJZDyUnqwB070OyP72g";
        const res = await jukebox.addMusic(invalidLink, sampleUser);
        expect(res).to.equal(false);
        expect(jukebox.numberOfSongs).to.equal(0);
        JukeboxItemFactory.setTextSearchEnabled(true);
      });
    });
    it("Should reject an invalid link", async () => {
      JukeboxItemFactory.setTextSearchEnabled(false);
      const invalidLink =
        "https://www.obviouslynotvalid.meh/watch?v=J7Iz5060PUE";
      const res = await jukebox.addMusic(invalidLink, sampleUser);
      expect(res).to.equal(false);
      expect(jukebox.numberOfSongs).to.equal(0);
      JukeboxItemFactory.setTextSearchEnabled(true);
    });
    it("Should be able to multiples tracks", async () => {
      const res1 = await jukebox.addMusic(
        "https://www.youtube.com/watch?v=J7Iz5060PUE",
        sampleUser
      );
      const res2 = await jukebox.addMusic(
        "https://www.youtube.com/watch?v=vVnE9o5Uxik",
        sampleUser
      );
      const res3 = await jukebox.addMusic(
        "https://www.youtube.com/watch?v=wZZ7oFKsKzY",
        sampleUser
      );
      expect(res1).to.equal(true);
      expect(res2).to.equal(true);
      expect(res3).to.equal(true);
      expect(jukebox.numberOfSongs).to.equal(3);
    });
    it("Should be able to add the same track multiple times", async () => {
      const res1 = await jukebox.addMusic(
        "https://www.youtube.com/watch?v=J7Iz5060PUE",
        sampleUser
      );
      const res2 = await jukebox.addMusic(
        "https://www.youtube.com/watch?v=J7Iz5060PUE",
        sampleUser
      );
      expect(res1).to.equal(true);
      expect(res2).to.equal(true);
      expect(jukebox.numberOfSongs).to.equal(2);
    });
    it("Should fallback on text searching when the text provided is not a link", async () => {
      const res = await jukebox.addMusic("beleu", sampleUser);
      expect(res).to.equal(true);
      expect(jukebox.numberOfSongs).to.equal(1);
      await setupPlayingState();
      jukebox.play(false);
      expect(jukebox.currentSong.track).to.equal(mockLink);
    });
  });
  describe("Play a music", () => {
    describe("When no music were added", () => {
      it("Should return false if queue is empty and emit a queue empty event", () => {
        const eventSpy = spy();
        jukebox.on("QueueEmpty", eventSpy);
        const res = jukebox.play(false);
        expect(res).to.be.equal(false);
        expect(jukebox.isPlaying).to.be.equal(false);
        expect(jukebox.numberOfSongs).to.be.equal(0);
        expect(jukebox.currentSong).to.be.equal(undefined);
        sinon.assert.calledOnce(eventSpy);
      });
    });
    describe("When music were added", () => {
      const firstLink = "https://www.youtube.com/watch?v=J7Iz5060PUE";
      const secondLink = "https://www.youtube.com/watch?v=wZZ7oFKsKzY";
      beforeEach(setupPlayingState);
      it("Should be able to start playing", () => {
        const res = jukebox.play(false);
        expect(res).to.be.equal(true);
      });
      it("Should go on to the next song at the end of the previous one", () => {
        jukebox.play(false);
        expect(jukebox.currentSong.track).to.be.equal(firstLink);
        jukebox.currentSong.emit("end");
        expect(jukebox.currentSong.track).to.be.equal(secondLink);
        expect(jukebox.isPlaying).to.be.equal(true);
      });
      it("Should stops playing when reaching the end of the playlist", () => {
        const res = jukebox.play(false);
        expect(jukebox.currentSong.track).to.be.equal(firstLink);
        jukebox.currentSong.emit("end");
        expect(jukebox.currentSong.track).to.be.equal(secondLink);
        jukebox.currentSong.emit("end");
        expect(jukebox.isPlaying).to.be.equal(false);
        expect(jukebox.currentSong).to.be.undefined;
      });
      it("Should not be using play when already playing", () => {
        const res = jukebox.play(false);
        expect(res).to.be.equals(true);
        expect(jukebox.play.bind(jukebox, false)).to.throw();
      });
    });
  });
  describe("Change volume", () => {
    it("Should change to a correct volume", () => {
      const newVolume = Math.floor(Math.random() * 101);
      jukebox.setVolume(newVolume);
      expect(jukebox.volume).to.be.equals(newVolume);
    });
    it("Should reject an incorrect volume format", () => {
      const betweenZeroAndOne = jukebox.setVolume("0.2");
      expect(betweenZeroAndOne).to.be.equals(false);
      const negative = jukebox.setVolume("-0.255");
      expect(negative).to.be.equals(false);
      const gibberish = jukebox.setVolume("sdkdssdjhsdhjsd");
      expect(gibberish).to.be.equals(false);
      const nan = jukebox.setVolume(NaN);
      expect(nan).to.be.equals(false);
      const infty = jukebox.setVolume(Infinity);
      expect(infty).to.be.equals(false);
    });
  });
});
