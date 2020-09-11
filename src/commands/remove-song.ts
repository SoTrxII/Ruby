import { Message } from "discord.js";
import { JukeboxCommand } from "../components/jukebox-command";
import { voiceChannelOnly } from "../decorators/voice-channel-only";

interface Args {
  index: number;
}

export default class RemoveSong extends JukeboxCommand {
  constructor(client) {
    super(client, {
      name: "remove",
      memberName: "remove",
      group: "music",
      description: "Remove a song in the playlist",
      examples: ["?remove 2"],
      args: [
        {
          key: "index",
          prompt: "Index of the song to remove in the playlist ",
          type: "integer",
        },
      ],
    });
  }

  @voiceChannelOnly()
  async run(message, args: Args): Promise<Message> {
    const jukebox = await this.getJukebox(
      await this.getTargetVoiceChannel(message)
    );
    try {
      jukebox.remove(args.index);
    } catch (e) {
      await message.say(`The playlist has no song with index ${args.index}`);
    }
    await this.displayQueue(message);

    return message;
  }
}
