import {
  Command,
  CommandInfo,
  CommandoClient,
  CommandoMessage,
} from "discord.js-commando";
import { JukeboxAPI } from "../@types/jukebox-API";
import { TYPES } from "../types";
import getDecorators from "inversify-inject-decorators";
import { container } from "../inversify.config";
import { DMChannel, Message, TextChannel, VoiceChannel } from "discord.js";
import { JUKEBOX_STATE } from "./jukebox";
import { debounce } from "../decorators/debounce";
import { SongProgressManagerAPI } from "../@types/song-progress-manager";
import { secondstoIso } from "../utilities/seconds-to-iso";
import { ILogger } from "../@types/logger";

const { lazyInject } = getDecorators(container);

export abstract class JukeboxCommand extends Command {
  @lazyInject(TYPES.Jukebox)
  private jukebox: JukeboxAPI;
  @lazyInject(TYPES.SongProgressManager)
  private progressManager: SongProgressManagerAPI;
  @lazyInject(TYPES.Logger)
  protected logger: ILogger;

  protected static JUKEBOX_EVENTS_SUBSCRIBED = false;
  protected static voiceChannel: VoiceChannel;
  /** Last used text channel, self update over time*/
  protected static textChannel: TextChannel | DMChannel;

  protected constructor(client: CommandoClient, infos: CommandInfo) {
    super(client, infos);
    if (
      this.jukebox.state === JUKEBOX_STATE.NOT_INITIALIZED &&
      !JukeboxCommand.JUKEBOX_EVENTS_SUBSCRIBED
    ) {
      JukeboxCommand.JUKEBOX_EVENTS_SUBSCRIBED = true;
      this.jukebox.onNewSong(this.displayQueue.bind(this));
      this.jukebox.onSongStart(this.updateProgressDisplay.bind(this));
      this.jukebox.onQueueEmpty(this.leaveWarningMessage.bind(this));
      this.jukebox.onQueueEmpty(this.resetProgressDisplay.bind(this));
    }
  }

  protected async updateProgressDisplay() {
    if (!this.jukebox.currentSong) return;
    const details = await this.jukebox.currentSong.getDetails();
    this.progressManager.start(this.client, details, 5000);
  }

  async run(message, args: any): Promise<Message> {
    let logString = `Executing command "${this.constructor.name}" `;
    if (args !== undefined) logString += `with parameters : ${JSON.stringify(args)}`;
    this.logger.info(logString);
    return message;
  }

  protected resetProgressDisplay() {
    this.progressManager.stop();
  }
  protected async getTargetVoiceChannel(
    message: Message
  ): Promise<VoiceChannel> {
    const asker = await message.guild.members.fetch(message.author.id);
    return asker.voice.channel;
  }

  protected async getJukebox(vc: VoiceChannel): Promise<JukeboxAPI> {
    if (
      this.jukebox.state === JUKEBOX_STATE.NOT_INITIALIZED ||
      JukeboxCommand.voiceChannel.id !== vc.id
    ) {
      JukeboxCommand.voiceChannel = vc;
      await this.jukebox.connect(vc);
    }
    return this.jukebox;
  }

  protected async formatQueue() {
    const queueDetails = await Promise.all(
      this.jukebox.queue.map(async (item) => await item.getDetails())
    );
    const currentSong = await this.jukebox.getCurrentSongDetails();
    if (!currentSong) return "Nothing in the playlist !";
    let nowPlaying = `**Playing** : :musical_note: ${currentSong.title} - ${
      currentSong.author
    } [${secondstoIso(currentSong.duration)}]`;
    if (this.jukebox.currentSong.isLooping) nowPlaying += "  :repeat:";
    const queueArray = queueDetails.map((details, index) => {
      return `${index + 1}) ${details.title} - ${
        details.author
      } [${secondstoIso(details.duration)}]`;
    });
    if (queueArray.length) {
      queueArray.unshift(`**Playlist (${queueDetails.length})** :`);
    }
    queueArray.unshift(nowPlaying);
    return queueArray.join("\n");
  }

  protected async leaveWarningMessage() {
    await JukeboxCommand.textChannel?.send(
      "Playlist empty ! Disconnecting in 5 minutes !"
    );
  }

  @debounce(2000)
  protected async displayQueue(message?: CommandoMessage): Promise<void> {
    if (message) JukeboxCommand.textChannel = message.channel;
    if (this.jukebox.queue)
      await JukeboxCommand.textChannel.send(await this.formatQueue());
  }
}
