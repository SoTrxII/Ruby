import container from "./inversify.config";
import { Client } from "discord.js";
import * as config from "../config.json";
import { parseTextCommand } from "./utils/command-handle";
import { replyRandom } from "./utils/reply-at-random";
import { GlobalExt } from "./@types/global";
import { TYPES } from "./types";
import * as debug0 from "debug";
const debug = debug0("Ruby");

declare const global: GlobalExt;
global.Config = config;
global.baseAppDir = __dirname;

// Constants
global.Rin = container.get<Client>(TYPES.Client);
const Rin = global.Rin; // Convenient alias
const COMMAND_PREFIX = "$";
Rin.on("ready", () => {
  console.log("Up & Ready to roll");
});

Rin.on("message", message => {
  // Bot has to ignore his own message.
  if (message.author.id === Rin.user.id) {
    return;
  }
  console.log(`@${message.author.username} : ${message.cleanContent}`);
  // Message variables.
  const isMentioned = message.isMentioned(Rin.user);
  const isCommand = message.content.startsWith(COMMAND_PREFIX);

  // Handle bot command
  if (isCommand) {
    // Commands goes here
    parseTextCommand(message).catch(console.error);
  } else if (isMentioned) {
    replyRandom(message).catch(debug);
  }
});

Rin.login(global.Config.Discord.RubyToken).then(() =>
  console.log("Successfully logged in")
);

let isExiting = false;

/**
 * @summary Handler to clean up remaining processes before exiting
 * @param  options variables to handle special case while switching off
 * @param  err Exception that caused Rin's death
 */
// tslint:disable-next-line:only-arrow-functions
//TODO: Add typedef for options and err
function exitHandler(options: any, err: any): void {
  if (isExiting) {
    return;
  }
  isExiting = true;
  if (options.panic) {
    console.error("\nUn uncaught Exception occured. Stopping Ruby", err.stack);
  } else if (options.cleanup) {
    console.debug("\nLogging out Ruby ...");
  }
  global.Rin.destroy().then(() => console.debug("Logged out ! Now Halting"));
  process.exit(0);
}

// do something when app is closing
process.on(
  "exit",
  exitHandler.bind(undefined, {
    cleanup: true
  })
);
// catches ctrl+c event
process.on(
  "SIGINT",
  exitHandler.bind(undefined, {
    cleanup: true
  })
);
// catches uncaught exceptions
process.on(
  "uncaughtException",
  exitHandler.bind(undefined, {
    panic: true
  })
);
