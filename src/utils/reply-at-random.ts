import * as MentionedRelics from "../../ruby-replics.json";

/**
 * Answer a message on a random basis.
 */
// tslint:disable-next-line:only-arrow-functions
export async function replyRandom(message): Promise<void> {
  // Get user specifics responses
  const authorCustomResponses = MentionedRelics.filter(
    usersReplics => usersReplics.id === message.author.id
  )[0].replics;
  // Get all users general reponses.
  const generalResponses = MentionedRelics[MentionedRelics.length - 1].all;
  const finalReplics = authorCustomResponses
    ? authorCustomResponses
    : generalResponses;

  await message.reply(
    finalReplics[Math.floor(Math.random() * finalReplics.length)]
  );
}
