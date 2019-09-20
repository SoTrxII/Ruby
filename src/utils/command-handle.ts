/**
 * Handles commands processing. Can display help, invoke commands function or reject commands
 * @module parseTextCommand
 */
import { Message } from "discord.js";
import { commands, help } from "../commands";

export function getHelpString(): string {
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
                    ? "\n\t__Alias__ : " +
                      (typeof help[commandDesc].aliases === "string"
                        ? help[commandDesc].aliases
                        : help[commandDesc].aliases.join(", "))
                    : ""
                }`;
  }
  return returnString;
}

// tslint:disable-next-line:only-arrow-functions
export async function parseTextCommand(message: Message): Promise<void> {
  const command = message.content
    .substring(1)
    .split(" ")[0]
    .toLowerCase();
  const parameters = message.content.substring(command.length + 2);

  // Redirect to special command help
  if (command === "help" || command === "halp") {
    await message.channel.send(getHelpString());

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

/**
 * Split arguments between text and url.
 * @example "https://www.youtube/watchdd jjkdd hdksjhd  https://www.youtube/watchdd dd"
 * should return ["https://www.youtube/watchdd", "jjkdd hdksjhd", "https://www.youtube/watchdd", "dd"]
 * @param cmdArg command line argument to parse
 * @returns valid arguments.
 */
export function getValids(cmdArg: string): Array<string> {
  const validStrings: Array<string> = [];
  if (cmdArg === undefined || cmdArg === "") {
    return validStrings;
  }
  const filtered = cmdArg.split(" ").filter(s => s !== "");
  const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
  let current: string = undefined;
  let buffered = "";
  while ((current = filtered.shift()) !== undefined) {
    if (urlRegex.test(current)) {
      if (buffered !== "") {
        validStrings.push(buffered.trim());
        buffered = "";
      }
      validStrings.push(current);
    } else {
      buffered += `${current} `;
    }
  }
  if (buffered !== "") {
    validStrings.push(buffered.trim());
  }
  return validStrings;
}
