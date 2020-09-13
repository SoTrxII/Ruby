import { CommandoClient } from "discord.js-commando";
import Timer = NodeJS.Timer;
import { JukeboxItemDetails } from "../@types/jukebox-item-API";
import { injectable } from "inversify";
import { secondstoIso } from "../utilities/seconds-to-iso";
import { Client } from "discord.js";
import { SongProgressManagerAPI } from "../@types/song-progress-manager";

@injectable()
export class SongProgressManager implements SongProgressManagerAPI {
  private expected: number;
  private timeout: Timer;
  private client: Client;
  private song: JukeboxItemDetails;
  private interval: number;
  private ticks = 0;
  private totalSongDurationIso: string;

  constructor() {}

  public start(
    client: CommandoClient,
    song: JukeboxItemDetails,
    interval = 5000
  ): void {
    this.reset();
    this.client = client;
    this.interval = interval;
    this.song = song;
    this.expected = Date.now() + this.interval;
    this.timeout = setTimeout(() => this.step(), this.interval);
    this.totalSongDurationIso = secondstoIso(this.song.duration);
    this.updateDisplay();
  }
  private reset(){
    this.ticks = 0;
    clearTimeout(this.timeout);
  }
  public stop(): void {
    this.reset();
    this.client.user.setActivity().catch(console.error);
  }

  private step(): void {
    this.ticks++;
    const drift = Date.now() - this.expected;
    this.updateDisplay();
    this.expected += this.interval;
    this.timeout = setTimeout(
      () => this.step(),
      Math.max(0, this.interval - drift)
    );
  }
  private updateDisplay(): void {
    const elapsed = secondstoIso(this.ticks * this.interval / 1000);
    this.client.user.setActivity({
      name: `[${elapsed}/${this.totalSongDurationIso}] ${this.song.title} - ${this.song.author}`,
      type: "PLAYING",
    });
  }
}
