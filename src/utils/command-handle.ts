/**
 * Handles commands processing. Can display help, invoke commands function or reject commands
 * @module parseTextCommand
 */
import { Message } from "discord.js";
import { commands, help } from "../commands";

// tslint:disable-next-line:only-arrow-functions
export async function parseTextCommand(message: Message): Promise<void> {
  const command = message.content
    .substring(1)
    .split(" ")[0]
    .toLowerCase();
  const parameters = message.content.substring(command.length + 2);

  // Redirect to special command help
  if (command === "help" || command === "halp") {
    let returnString = "";
    for (const commandDesc of Object.keys(help).sort()) {
      returnString += `\n **\`$${commandDesc}\`** ${
        help[commandDesc].parameters
          ? "_`" + help[commandDesc].parameters + "`_"
          : ""
      }\n\t\
                _${help[commandDesc].desc}_\
                ${
                  help[commandDesc].aliases
                    ? "\n\t__Alias__ : " + help[commandDesc].aliases.join(", ")
                    : ""
                }`;
    }
    await message.channel.send(returnString);

    return;
  }

  // Check if command exists
  if (!commands[command]) {
    return;
  }

  // Execute commands.
  await commands[command](message, command, parameters).catch(e =>
    console.error(`Failed to resolve command : ${e.stack}`)
  );
}
