import { JukeboxCommand } from "../components/jukebox-command";

/**
 * This decorator restricts a Jukebox command by only enabling user connected to a voice channel to use it.
 */
export function voiceChannelOnly() {
  return (
    target: JukeboxCommand,
    propertyKey: string,
    propertyDescriptor: PropertyDescriptor
  ) => {
    const originalMethod = propertyDescriptor.value;

    propertyDescriptor.value = async function(...args: any[]) {
      const message = args[0];
      const asker = await message.guild.members.fetch(message.author.id);
      const voiceChannel = asker.voice.channel;
      if (!voiceChannel) {
        await message.say(
          "You must be in a voice channel to run this command"
        );
        return;
      }
      //If the user is connected to a voice channel, let the method continue
      originalMethod.apply(this, args);
    };
  };
}