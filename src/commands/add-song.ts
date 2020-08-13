import { Message } from "discord.js";
import { JukeboxCommand } from "../components/jukebox-command";
import { voiceChannelOnly } from "../decorators/voice-channel-only";
import { JUKEBOX_STATE } from "../components/jukebox";

interface Args {
  query: string;
}

export default class AddSong extends JukeboxCommand {
  constructor(client) {
    super(client, {
      name: "am",
      aliases: ["addmusic"],
      memberName: "addmusic",
      group: "music",
      description: "Add one or multiple items to the playlist",
      examples: [
        "?am https://www.youtube.com/watch?v=FKLtgamrhpk",
        "?am https://www.youtube.com/watch?v=FKLtgamrhpk https://www.youtube.com/watch?v=Fjqs-qmkNug",
        "?am chicken"
      ],
      args: [
        {
          key: "query",
          prompt: "Direct YouTube Link or plaintext query",
          type: "string"
        }
      ]
    });
  }

  @voiceChannelOnly()
  async run(message, args: Args): Promise<Message> {
    const jukebox = await this.getJukebox(
      await this.getTargetVoiceChannel(message)
    );
    const songPromises = args.query
      .split(/\s+http/)
      .filter(s => s != "")
      .map(async query => {
        try {
          await jukebox.addSong(query);
        } catch (e) {
          await message.say(
            `No youtube videos found matching "${query}"`
          );
          return;
        }
      });
    await Promise.all(songPromises);

    if (jukebox.state === JUKEBOX_STATE.STOPPED) {
      await jukebox.play();
    }
    await this.displayQueue(message);

    return message;
  }
}
