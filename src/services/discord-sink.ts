/**
 * Multi-shard UDP Audio Sink to Discord voice channel
 */
import { inject, injectable } from "inversify";
import type { Snowflake, VoiceChannel } from "discord.js";
import { Client, Constants, Guild, WebSocketShard } from "discord.js";
import type {
  GatewayVoiceServerUpdateDispatchData,
  GatewayVoiceStateUpdateDispatchData,
} from "discord-api-types/v8";
import { Readable } from "stream";
import { ISink } from "../@types/jukebox";
import { TYPES } from "../types";
import type * as dVTypes from "@discordjs/voice";
import type {
  AudioPlayer,
  AudioPlayerStatus,
  DiscordGatewayAdapterCreator,
} from "@discordjs/voice";
import { VoiceConnection, VoiceConnectionStatus } from "@discordjs/voice";

@injectable()
export class DiscordSink implements ISink {
  /** Main audio player **/
  private player: AudioPlayer;
  /** Voice adapter for every guild the bot joined */
  private adapters = new Map<
    Snowflake,
    dVTypes.DiscordGatewayAdapterLibraryMethods
  >();
  /** Each Shard **/
  private trackedClients = new Set<Client>();
  /** Every shard and their associated guilds*/
  private trackedGuilds = new Map<WebSocketShard, Set<Snowflake>>();
  /** Max time to wait before an audio resource starts playing */
  private static readonly PLAY_TIMEOUT_MS = 15e3;
  /** Max time to join a voice channel */
  private static readonly JOIN_TIMEOUT_MS = 30e3;

  constructor(@inject(TYPES.DJS_VOICE) private dVoice: typeof dVTypes) {
    this.player = dVoice.createAudioPlayer();
  }
  /**
   * Plays a readable stream on the joined voice.
   * This can only be called when the sink is in the correct state
   * @param stream
   * @param opt
   */
  async play(
    stream: Readable,
    opt = { inputType: this.dVoice.StreamType.Opus }
  ): Promise<AudioPlayer> {
    if (this.player.state.status === this.dVoice.AudioPlayerStatus.Playing) {
      throw new Error(`The audio player is already playing`);
    }
    const resource = this.dVoice.createAudioResource(stream, opt);
    this.player.play(resource);
    return await this.dVoice.entersState(
      this.player,
      this.dVoice.AudioPlayerStatus.Playing,
      DiscordSink.PLAY_TIMEOUT_MS
    );
  }

  /**
   * Pause the playing stream. Throws if the player is not playing.
   */
  pause(): void {
    if (this.player.state.status !== this.dVoice.AudioPlayerStatus.Playing) {
      throw new Error(`The audio player is not playing`);
    }
    this.player.pause();
  }

  /**
   * Resume the paused stream. Throws if the player is not paused.
   */
  resume(): void {
    if (this.player.state.status !== this.dVoice.AudioPlayerStatus.Paused) {
      throw new Error(`The audio player is not paused`);
    }
    this.player.unpause();
  }

  /**
   * Stops the playing stream
   */
  stop(): void {
    this.player.stop();
  }

  /**
   * Get the current status (playing/paused/stopped) of the player
   */
  get state(): AudioPlayerStatus {
    return this.player.state.status;
  }

  /**
   * Attempt to join the provided voice channel. Throws on errors
   * @param channel
   */
  async joinVoiceChannel(channel: VoiceChannel): Promise<VoiceConnection> {
    const connection = this.dVoice.joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: this.createAdapter(channel),
    });
    try {
      await this.dVoice.entersState(
        connection,
        VoiceConnectionStatus.Ready,
        DiscordSink.JOIN_TIMEOUT_MS
      );
      // Register the voice connection on the audio player
      // allowing the player to play on the voice channel
      connection.subscribe(this.player);
      return connection;
    } catch (error) {
      connection.destroy();
      throw error;
    }
  }

  /**
   * Leave the provided voice channel
   * @param channel
   */
  leaveVoiceChannel(channel: VoiceChannel): void {
    // Connection object is a singleton, we can retrieve the current connection that way
    const connection = this.dVoice.joinVoiceChannel({
      channelId: channel.id,
      guildId: channel.guild.id,
      adapterCreator: this.createAdapter(channel),
    });
    connection.destroy();
  }

  /**
   * Tracks a Discord.js client, listening to VOICE_SERVER_UPDATE and VOICE_STATE_UPDATE events.
   * @param client - The Discord.js Client to track
   */
  private trackClient(client: Client) {
    if (this.trackedClients.has(client)) return;
    this.trackedClients.add(client);
    client.ws.on(
      Constants.WSEvents.VOICE_SERVER_UPDATE,
      (payload: GatewayVoiceServerUpdateDispatchData) => {
        this.adapters.get(payload.guild_id)?.onVoiceServerUpdate(payload);
      }
    );
    client.ws.on(
      Constants.WSEvents.VOICE_STATE_UPDATE,
      (payload: GatewayVoiceStateUpdateDispatchData) => {
        if (
          payload.guild_id &&
          payload.session_id &&
          payload.user_id === client.user?.id
        ) {
          this.adapters.get(payload.guild_id)?.onVoiceStateUpdate(payload);
        }
      }
    );
  }

  /**
   * If a shard dies, clean up all it's associated guilds
   * @param shard
   * @private
   */
  private cleanupGuilds(shard: WebSocketShard) {
    const guilds = this.trackedGuilds.get(shard);
    if (guilds) {
      for (const guildID of guilds.values()) {
        this.adapters.get(guildID)?.destroy();
      }
    }
  }

  /**
   * Track which shard is connected to which guild
   * @param guild
   * @private
   */
  private trackGuild(guild: Guild) {
    let guilds = this.trackedGuilds.get(guild.shard);
    if (!guilds) {
      const cleanup = () => this.cleanupGuilds(guild.shard);
      guild.shard.on("close", cleanup);
      guild.shard.on("destroyed", cleanup);
      guilds = new Set();
      this.trackedGuilds.set(guild.shard, guilds);
    }
    guilds.add(guild.id);
  }

  /**
   * Create a voice channel adapter, allowing to send packets from a Shard to a voice channel
   * @param channel
   * @private
   */
  private createAdapter(channel: VoiceChannel): DiscordGatewayAdapterCreator {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    return (methods) => {
      this.adapters.set(channel.guild.id, methods);
      this.trackClient(channel.client);
      this.trackGuild(channel.guild);
      return {
        sendPayload(data) {
          if (channel.guild.shard.status === Constants.Status.READY) {
            channel.guild.shard.send(data);
            return true;
          }
          return false;
        },
        destroy() {
          return self.adapters.delete(channel.guild.id);
        },
      };
    };
  }
}
