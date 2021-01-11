import { Message } from "discord.js";
import { JukeboxCommand } from "../components/jukebox-command";
import { voiceChannelOnly } from "../decorators/voice-channel-only";
import { JUKEBOX_STATE } from "../components/jukebox";

export default class ResumeSong extends JukeboxCommand {
  constructor(client) {
    super(client, {
      name: "resume",
      aliases: ["play"],
      memberName: "resume",
      group: "music",
      description: "Resume playback",
      examples: ["?resume", "?play"]
    });
  }

  @voiceChannelOnly()
  async run(message, args: never): Promise<Message> {
    await super.run(message, undefined);
    const jukebox = await this.getJukebox(
      await this.getTargetVoiceChannel(message)
    );
    if (
      jukebox.state !== JUKEBOX_STATE.PAUSED &&
      jukebox.state !== JUKEBOX_STATE.STOPPED
    ) {
      await message.say("Jukebox isn't paused !");
      return;
    }

    if (jukebox.state === JUKEBOX_STATE.PAUSED) {
      jukebox.resume();
    } else if (jukebox.state === JUKEBOX_STATE.STOPPED) {
      await jukebox.play();
    }
    return message;
  }
}
