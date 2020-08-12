import { Message } from "discord.js";
import { JukeboxCommand } from "../components/jukebox-command";
import { voiceChannelOnly } from "../decorators/voice-channel-only";
import { JUKEBOX_STATE } from "../components/jukebox";

export default class PauseSong extends JukeboxCommand {
    constructor(client) {
        super(client, {
            name: "pause",
            memberName: "pause",
            group: "music",
            description: "Pause playback",
            examples: ["?pause"]
        });
    }

    @voiceChannelOnly()
    async run(message, args: never): Promise<Message> {
        const jukebox = await this.getJukebox(
            await this.getTargetVoiceChannel(message)
        );
        if (jukebox.state !== JUKEBOX_STATE.PLAYING) {
            await message.say("Jukebox isn't currently playing !");
            return;
        }
        await jukebox.pause();
        await message.say("Jukebox paused !")
        return message;
    }
}
