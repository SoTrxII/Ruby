import { Message } from "discord.js";
import { JukeboxCommand } from "../components/jukebox-command";
import { voiceChannelOnly } from "../decorators/voice-channel-only";
import { JUKEBOX_STATE } from "../components/jukebox";

export default class StopPlaying extends JukeboxCommand {
    constructor(client) {
        super(client, {
            name: "stop",
            memberName: "stop",
            group: "music",
            description: "Stops playback",
            examples: [
                "?stop"
            ]
        });
    }

    @voiceChannelOnly()
    async run(message, args: never): Promise<Message> {
        const jukebox = await this.getJukebox(
            await this.getTargetVoiceChannel(message)
        );

        if (jukebox.state === JUKEBOX_STATE.PLAYING) {
            await jukebox.stop();
        }
        return message;
    }
}
