import { GlobalExt } from "../@types/global";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type testFunctionType = (...args: Array<any>) => boolean;
import { Message } from "discord.js";
declare const global: GlobalExt;

/**
 * @summary Wait for a user to post a valid message
 * @param  authorId who are we waiting for ?
 * @param  validation is the given message valid ? Returns True or False
 * @param timeout Reject automatically after a certain time (-1 for infinite)
 * @returns Resolve with the message the user sent.
 */
// tslint:disable-next-line:only-arrow-functions
export async function waitForMessage(
  authorId: string,
  validation: testFunctionType,
  timeout: number
): Promise<Message> {
  let resolve;
  let reject;

  // We actually need the function() for arguments to be defined
  // tslint:disable-next-line:only-arrow-functions
  const promLock: Promise<Message> = new Promise<Message>(function(): void {
    // eslint-disable-next-line prefer-rest-params
    [resolve, reject] = arguments;
  });

  const func = (message: Message): Promise<Message> => {
    if (message.author.id === authorId) {
      if (validation(message.content, message)) {
        global.Rin.off("message", func);
        resolve(message);
      }
    }
  };

  if (timeout !== -1) {
    setTimeout(() => {
      global.Rin.off("message", func);
      reject(new Error("timeout"));
    }, timeout);
  }

  global.Rin.on("message", func);

  return promLock;
}

/**
 * @summary Ask a user a yes / no question
 * @param evt General handle to text channel
 * @param  authorId Id of the one user that has to answer
 * @param question question to ask
 * @param timeout timeout for the question. (Default is 5') Null is then returned.
 * @returns true for yes, false for no, null if timeout
 */
// tslint:disable-next-line:only-arrow-functions
export async function yesNoQuestion(
  evt: Message,
  authorId: string,
  question: string,
  timeout: number
): Promise<boolean> {
  await evt.reply(`${question} [O/n]`);
  const messageValidation = (message: string): boolean => {
    const validResponses = ["O", "o", "n", "N", "Oui", "Non", "oui", "non"];
    const isValid = validResponses.includes(message);
    if (!isValid) {
      evt.reply("C'est oui ou non...").catch(undefined);
    }

    return isValid;
  };

  const chosenMessage = await waitForMessage(
    authorId,
    messageValidation,
    timeout || 5 * 60 * 1000
  ).catch(undefined);
  const positiveAnswers = ["O", "o", "Oui", "oui"];

  return positiveAnswers.includes(chosenMessage.content);
}

interface ChooseOneItemOptions {
  /** what to reply if no item is found */
  noItemResponse: string;
  /** question's timeout */
  timeout?: number;
  /** Whether to display the choices to the user */
  displayChoices?: boolean;
}
/**
 * @summary Make the user choose between the choices in itemList
 * @param evt General handle to text channel
 * @param itemList Choices. Each choice has to have a .toString() method
 * @param question Question to ask the user
 * @param options optional parameters
 * @returns chosen item or null if no item, stopped or timeout
 */
// tslint:disable-next-line:only-arrow-functions
export async function chooseOneItem<T>(
  evt: Message,
  itemList: Array<T>,
  question: string,
  options: ChooseOneItemOptions
): Promise<T> {
  if (itemList.length === 0) {
    await evt.reply(options.noItemResponse);

    return undefined;
  }

  let chosenItem;
  if (itemList.length === 1) {
    chosenItem = itemList[0];
  } else {
    let choicestring = `${question} (staph pour annuler) \n`;

    if (options.displayChoices) {
      for (const [index, campaign] of itemList.entries()) {
        choicestring += `\t\t**${index + 1}**)\t-->\t`;
        choicestring += await campaign.toString();
      }
    }

    await evt.channel.send(choicestring);
    const choice = await waitForMessage(
      evt.author.id,
      message => {
        if (message === "staph") {
          return true;
        }
        const choiceIndex = parseInt(message, 10);
        if (choiceIndex > itemList.length || choiceIndex < 1) {
          evt
            .reply(
              `Je te dis entre 1 et ${itemList.length} et tu me réponds ${choiceIndex}...`
            )
            .catch(console.error);

          return false;
        }
        if (isNaN(choiceIndex) || !isFinite(choiceIndex)) {
          evt
            .reply("Numbers, do you speak it ? Try again !")
            .catch(console.error);

          return false;
        }

        return true;
      },
      options.timeout || 5 * 60 * 100
    ).catch(undefined);

    if (choice.content === "staph") {
      await evt.channel.send("Annulé !");

      return undefined;
    }
    chosenItem = itemList[parseInt(choice.content, 10) - 1];
  }

  return chosenItem;
}
