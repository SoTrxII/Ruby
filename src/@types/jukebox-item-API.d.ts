import { StreamDispatcher, VoiceConnection } from "discord.js";

export interface JukeboxItemDetails {
  title: string;
  author: string;
  description: string;
  image: string;
  url: string;
  duration: number;
}

export interface JukeboxItemAPI {
  readonly url: string;
  play(vc: VoiceConnection): Promise<StreamDispatcher>;
  getDetails(): Promise<JukeboxItemDetails>
}
