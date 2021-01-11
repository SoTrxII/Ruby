import { Message } from "discord.js";
import { JukeboxCommand } from "../components/jukebox-command";
import { voiceChannelOnly } from "../decorators/voice-channel-only";

export default class ShowQueue extends JukeboxCommand {
    constructor(client) {
        super(client, {
            name: "playlist",
            aliases: ["queue"],
            memberName: "playlist",
            group: "music",
            description: "Show incoming songs list",
            examples: ["?playlist", "?queue"]
        });
    }
    @voiceChannelOnly()
    async run(message, args: never): Promise<Message> {
        await super.run(message, undefined);
        const jukebox = await this.getJukebox(
            await this.getTargetVoiceChannel(message)
        );
        if (jukebox.queue) await message.say(await this.formatQueue());
        else await message.say("Playlist empty !");
        return message;
    }
}
