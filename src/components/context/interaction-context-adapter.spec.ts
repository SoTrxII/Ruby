import "reflect-metadata";
import { Substitute } from "@fluffy-spoon/substitute";
import {
  ApplicationCommandOption,
  ApplicationCommandOptionData,
  Client,
  CommandInteraction,
} from "discord.js";
import { InteractionAdapter } from "./interaction-context-adapter";
describe("Message Context", () => {
  let adapter: InteractionAdapter;
  const nullInteraction = Substitute.for<CommandInteraction>();
  beforeAll(() => {
    adapter = new InteractionAdapter(Substitute.for<Client>(), nullInteraction);
  });

  it("Basic methods", async () => {
    // These are direct bindings to DJS API, nothing to test except that it doesn't throw
    await expect(adapter.reply("test")).resolves.not.toThrow();
    await expect(adapter.getGuild()).resolves.not.toThrow();
    await expect(adapter.getAuthorVoiceChannel()).resolves.not.toThrow();
    expect(
      adapter.getArgs(Substitute.for<ApplicationCommandOptionData[]>())
    ).not.toThrow();
    expect(adapter.author).not.toThrow();
  });
});
