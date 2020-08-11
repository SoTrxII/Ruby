import "reflect-metadata";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { JukeboxAPI } from "../@types/jukebox-API";
import { InvalidQueryError } from "./jukebox";

describe("Jukebox", () => {
  let jukebox: JukeboxAPI;
  beforeEach(() => {
    jukebox = container.get<JukeboxAPI>(TYPES.Jukebox);
  });
  describe("Adding a song", () => {
    it("Should be able to add a song by searching it", async () => {
      const validQuery = "ten millions voices";
      await jukebox.addSong(validQuery);
      expect(jukebox.queue.length).toEqual(1);
    });

    it("Should be able to add a song by using the URL directly", async () => {
      const validVideo = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      await jukebox.addSong(validVideo);
      expect(jukebox.queue.length).toEqual(1);
      expect(jukebox.queue[0].url).toEqual(validVideo);
    });

    it("Should be able to add multiple songs by using the URLs directly", async () => {
      const validVideo = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      const validVideo2 = "https://www.youtube.com/watch?v=hIy3Mj9Jv94";
      await jukebox.addSong(validVideo);
      await jukebox.addSong(validVideo2);
      expect(jukebox.queue.length).toEqual(2);
      expect(jukebox.queue[0].url).toEqual(validVideo);
      expect(jukebox.queue[1].url).toEqual(validVideo2);
    });

    it("Should handle cases when no song match are found", async () => {
      const invalidQuery = "sdksdhdsqhqdsjlhdsqjqdshdsqjsdqsq,,sddsds";
      await expect(jukebox.addSong(invalidQuery)).rejects.toThrow(
          InvalidQueryError
      );
      expect(jukebox.queue.length).toEqual(0);
    });
  })
  describe("Song details", () => {
    beforeEach( async () => {
      await jukebox.addSong("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    });
    it("Should get the current song details", async () => {
      const details = await jukebox.getCurrentSongDetails();
      console.log(details);
    })
  })

});
