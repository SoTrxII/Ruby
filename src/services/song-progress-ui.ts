import { inject, injectable } from "inversify";
import Timer = NodeJS.Timer;
import { Client } from "discord.js";
import { SongDetails } from "../@types/jukebox";
import { secondsToIso } from "../components/date-utils";
import { TYPES } from "../types";

@injectable()
export class SongProgressUi {
  private expected: number;
  private timeout: Timer;
  private client: Client;
  private song: SongDetails;
  private interval: number;
  private ticks = 0;
  private totalSongDurationIso: string;

  constructor(
    @inject(TYPES.CLIENT_FACTORY) private clientFactory: () => Client
  ) {}

  public start(song: SongDetails, interval = 5000): void {
    const client = this.clientFactory();
    this.reset();
    this.client = client;
    this.interval = interval;
    this.song = song;
    this.expected = Date.now() + this.interval;
    this.timeout = setTimeout(() => this.step(), this.interval);
    this.totalSongDurationIso = secondsToIso(this.song.duration);
    this.updateDisplay();
  }
  private reset() {
    this.ticks = 0;
    clearTimeout(this.timeout);
  }

  public pause() {
    clearTimeout(this.timeout);
    this.client.user.setActivity({
      name: `PAUSED`,
      type: "PLAYING",
    });
  }

  public resume() {
    this.updateDisplay();
    this.timeout = setTimeout(() => this.step(), this.interval);
  }
  public stop(): void {
    this.reset();
    this.client.user.setActivity();
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
    const elapsed = secondsToIso((this.ticks * this.interval) / 1000);
    this.client.user.setActivity({
      name: `[${elapsed}/${this.totalSongDurationIso}] ${this.song.title} - ${this.song.author}`,
      type: "PLAYING",
    });
  }
}
