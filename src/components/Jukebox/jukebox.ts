import { EventEmitter } from "events";
import { TextChannel, VoiceConnection } from "discord.js";
import { JukeboxItem } from "./jukebox-item";
import { JukeboxItemFactory } from "./jukebox-item-factory";

import debug0 from "debug";
import { injectable } from "inversify";

const debug = debug0("jukebox");

@injectable()
export class Jukebox extends EventEmitter {
  /**
   * Is the Jukebox playing right now ?
   */
  isPlaying = false;
  /**
   * playback volume
   */
  volume = 55;
  /**
   * What's being being played
   */
  currentSong: JukeboxItem;
  /**
   * List of music to be played
   */
  private _playQueue: JukeboxItem[] = [];
  private islooping: boolean;

  constructor(
    private _voiceConnection: VoiceConnection,
    public textChannel: TextChannel
  ) {
    super();
  }

  get voiceConnection(): VoiceConnection {
    return this._voiceConnection;
  }

  /**
   * @summary Change the vocie connection to stream into
   * @param {Discord/VoiceConnection} vc new voice connections
   */
  set voiceConnection(vc: VoiceConnection) {
    this._voiceConnection = vc;

    // Also update every item in the playlist
    // as they were constructed with the old voice connection
    this._playQueue.forEach(item => {
      item.voiceConnection = vc;
    });
  }

  get numberOfSongs() {
    return this._playQueue.length;
  }

  /**
   * @param track Source track to add to the playlist
   * @param asker Who's aking to add it
   * @returns True if the track was added
   */
  async addMusic(track, asker): Promise<boolean> {
    let newItem;
    try {
      newItem = await JukeboxItemFactory.createItem(
        track,
        this._voiceConnection,
        asker
      );
    } catch (e) {
      await this.textChannel.send(
        `Erreur inatendue avec le lien ${track}: ${e}, on skip la chanson !`
      );
      return false;
    }

    if (newItem === undefined) {
      await this.textChannel.send(
        `${track} n'est pas un lien valide, non ajouté à la liste de lecture`
      );
      return false;
    }
    this._playQueue.push(newItem);
    debug(
      `Ajout de musique, nouvelle longueur de file : ${this._playQueue.length}`
    );
    return true;
  }

  /**
   * @public
   * @summary Begin playing the songs in the queue
   * @param displaySong Send details about the song in the text channel before playing
   * @param stopAfter If positive stops the song after a ceratin time (seconds)
   * @returns false if could not play
   * @listens JukeboxItem#end for relooping
   */
  play(displaySong = true, stopAfter = -1): boolean {
    if (this.isPlaying) {
      throw new Error("The jukebox is already playing !");
    }

    if (!this._nextSong()) {
      /**
       * Emitted when there are no more songs to play.
       * @event Jukebox#QueueEmpty
       */
      this.emit("QueueEmpty");
      return false;
    }

    this.isPlaying = true;
    let profileInterval = undefined;

    debug(this.currentSong);

    if (displaySong) {
      // Send details about the song (async,
      // as we don't really need to wait for it to resolve)
      this.currentSong.toEmbed().then(async embed => {
        await this.textChannel.send("Chanson en cours : ");
        this.textChannel.send({
          embed
        });
      });
      const user = this._voiceConnection.client.user;
      profileInterval = setInterval(() => {
        this.currentSong.toString().then(async str => {
          user
            .setActivity(str, {
              type: "STREAMING"
            })
            .catch(debug);
        });
      }, 3000);
    }

    this.currentSong.play({
      volume: this.volume / 100,
      passes: 2
    });
    let timeout;
    // Loop after song
    this.currentSong.on("end", () => {
      // If the event triggers before the timeout, clear it
      if (timeout) {
        clearTimeout(timeout);
      }
      clearInterval(profileInterval);
      this.onEnd(displaySong, stopAfter).catch(debug);
    });
    // setTimeout( () => this.currentSong.on('end', (evt) => this.onEnd(evt), 5000));
    return true;
  }

  /**
   * Event handler for @see{@link{JukeboxItem#end}}
   * @summary What to do at the end of a track
   */
  async onEnd(displaySong, stopAfter): Promise<void> {
    debug("END");
    const user = this._voiceConnection.client.user;
    user.setActivity(undefined);
    this.currentSong.off("end", this.onEnd);
    this.isPlaying = false;
    this.play(displaySong, stopAfter);
  }

  /**
   * @async
   * @public
   * @summary Display the playing queue into the discord channel
   */
  async displayQueue() {
    if (this._playQueue.length === 0) {
      this.textChannel.send("Liste vide !");
      return;
    }
    let index = 0;
    let string = ``;
    for (const item of this._playQueue) {
      string += `${++index})  ${await item.toString()}\n`;
    }
    this.textChannel.send(string);
  }

  /**
   * Remove a song from the waiting queue
   */
  removeFromQueue(index: number): boolean {
    if (index < 0 || index > this._playQueue.length) {
      return false;
    }
    this._playQueue.splice(index, 1);
    return true;
  }

  /**
   * Empty the playlist
   */
  removeAllFromQueue(): void {
    this._playQueue = [];
  }

  /**
   * @summary Change playback volume
   * @param newVolume
   * @return False if parameters is invalid, false otherwise
   */
  setVolume(newVolume) {
    if (
      !parseInt(newVolume) ||
      !isFinite(newVolume) ||
      isNaN(newVolume) ||
      newVolume < 0 ||
      newVolume > 100
    ) {
      return false;
    }

    this.volume = newVolume;
    if (this.isPlaying) {
      this.currentSong.setVolume(newVolume / 100);
    }
    return true;
  }

  /**
   * @summary Skip current song and go to the next one
   * @returns False if there is no next song
   */
  skip() {
    this.currentSong.stop();
    return true;
  }

  /**
   * @summary Stop current song playback
   * @param {Boolean} [startNext=true] Wether to start the next song in the list
   * @returns True if stopped
   */
  stop(startNext = true) {
    if (!startNext) {
      this.currentSong.removeAllListeners("end");
    }
    const hasWorked = this.currentSong.stop();
    if (hasWorked) {
      this.isPlaying = false;
      const user = this._voiceConnection.client.user;
      user.setActivity(undefined);
    }
    return hasWorked;
  }

  /**
   * @summary Check if the jukebox is paused
   * @returns {Boolean}
   */
  isPaused(): boolean {
    return this.currentSong && this.currentSong.isPaused;
  }

  /**
   * @summary Pause the playback
   * @returns false if could not pause the playback
   */
  pause(): boolean {
    if (this.currentSong.pause()) {
      const user = this._voiceConnection.client.user;
      this.currentSong.toString().then(async str => {
        user.setActivity("[PAUSED]" + str, {
          type: "STREAMING"
        });
      });

      return true;
    }
    return false;
  }

  /**
   * @summary Resume the playback
   * @returns false if could not resume the playback
   */
  resume(): boolean {
    if (this.currentSong.resume()) {
      const user = this._voiceConnection.client.user;
      this.currentSong.toString().then(async str => {
        user.setActivity(str, {
          type: "STREAMING"
        });
      });
      return true;
    }
    return false;
  }

  /**
   * @public
   * @param {Discord/textChannel} textChannel
   */
  setTextChannel(textChannel) {
    this.textChannel = textChannel;
  }

  setLoop(b: boolean) {
    this.islooping = b;
  }

  /**
   * Take the next song in queue
   * @returns False if could not get next song
   */
  private _nextSong(): boolean {
    debug(`Longueur de la file : ${this._playQueue.length}`);
    if (!this.islooping && !this._playQueue.length) {
      this.isPlaying = false;
      this.currentSong = undefined;
      return false;
    }
    if (this.currentSong) {
      this.currentSong.stop();
      this.isPlaying = false;
    }
    if (!this.islooping) {
      this.currentSong = this._playQueue.shift();
    }

    return true;
  }
}
