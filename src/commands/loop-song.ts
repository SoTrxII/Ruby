import { Message } from "discord.js";
import { JukeboxCommand } from "../components/jukebox-command";
import { voiceChannelOnly } from "../decorators/voice-channel-only";

export default class LoopSong extends JukeboxCommand {
    constructor(client) {
        super(client, {
            name: "loop",
            memberName: "loop",
            group: "music",
            description: "Replay the current playing song over and over again",
            examples: ["?loop"]
        });
    }
    @voiceChannelOnly()
    async run(message, args: never): Promise<Message> {
        const jukebox = await this.getJukebox(
            await this.getTargetVoiceChannel(message)
        );
        await super.run(message, await jukebox.currentSong);
        if(jukebox.currentSong) jukebox.loop(true);
        if (jukebox.queue) await message.say(await this.formatQueue());
        return message;
    }
}
