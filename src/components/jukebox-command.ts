import {Command, CommandInfo, CommandoClient, CommandoMessage} from "discord.js-commando";
import {JukeboxAPI} from "../@types/jukebox-API";
import {TYPES} from "../types";
import getDecorators from "inversify-inject-decorators";
import {container} from "../inversify.config";
import {DMChannel, Message, TextChannel, VoiceChannel} from "discord.js";
import {JUKEBOX_STATE} from "./jukebox";
import {debounce} from "../decorators/debounce";

const { lazyInject } = getDecorators(container);

export abstract class JukeboxCommand extends Command {
  @lazyInject(TYPES.Jukebox)
  private jukebox: JukeboxAPI;

  protected static JUKEBOX_EVENTS_SUBSCRIBED = false;
  protected static voiceChannel: VoiceChannel;
  /** Last used text channel, self update over time*/
  protected static textChannel: TextChannel | DMChannel;

  protected constructor(client: CommandoClient, infos: CommandInfo) {
    super(client, infos);
    if(this.jukebox.state === JUKEBOX_STATE.NOT_INITIALIZED && !JukeboxCommand.JUKEBOX_EVENTS_SUBSCRIBED){
      JukeboxCommand.JUKEBOX_EVENTS_SUBSCRIBED = true;
      this.jukebox.onNewSong( this.displayQueue.bind(this) )
      this.jukebox.onQueueEmpty( this.leaveWarningMessage.bind(this) )
    }
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
      this.jukebox.queue.map(async item => await item.getDetails())
    );
    const currentSong = await this.jukebox.getCurrentSongDetails();
    if (!currentSong) return "Plus de chansons dans la liste !";
    let nowPlaying = `**En cours** : :musical_note: ${currentSong.title} - ${currentSong.author}`;
    const queueArray = queueDetails.map((details, index) => {
      return `${index + 1}) ${details.title} - ${details.author}`;
    });
    if (queueArray.length){
      queueArray.unshift(`**En attente (${queueDetails.length})** :`);
    }
    queueArray.unshift(nowPlaying);
    return queueArray.join("\n");
  }

  protected async leaveWarningMessage(){
    await JukeboxCommand.textChannel?.send("Playlist empty ! Disconnecting in 5 minutes !");
  }

  @debounce(2000)
  protected async displayQueue(message?: CommandoMessage): Promise<void>{
    if(message) JukeboxCommand.textChannel = message.channel;
    if(this.jukebox.queue) await JukeboxCommand.textChannel.send(await this.formatQueue());
  }
}
