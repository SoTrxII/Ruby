import { Message } from "discord.js";
import { JukeboxCommand } from "../components/jukebox-command";
import { voiceChannelOnly } from "../decorators/voice-channel-only";

export default class UnloopSong extends JukeboxCommand {
    constructor(client) {
        super(client, {
            name: "unloop",
            memberName: "unloop",
            group: "music",
            description: "Cancel the looping of the current song",
            examples: ["?unloop"]
        });
    }
    @voiceChannelOnly()
    async run(message, args: never): Promise<Message> {
        const jukebox = await this.getJukebox(
            await this.getTargetVoiceChannel(message)
        );
        await super.run(message, await jukebox.currentSong);
        if(jukebox.currentSong) jukebox.loop(false);
        if (jukebox.queue) await message.say(await this.formatQueue());
        return message;
    }
}
