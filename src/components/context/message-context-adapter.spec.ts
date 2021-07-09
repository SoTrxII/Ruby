import "reflect-metadata";
import { MessageAdapter } from "./message-context-adapter";
import { Substitute } from "@fluffy-spoon/substitute";
import { ApplicationCommandOption, Client, Message } from "discord.js";
describe("Message Context", () => {
  let adapter: MessageAdapter;
  const nullMessage = Substitute.for<Message>();
  beforeAll(() => {
    adapter = new MessageAdapter(Substitute.for<Client>(), nullMessage);
  });

  it("Basic methods", async () => {
    // These are direct bindings to DJS API, nothing to test except that it doesn't throw
    await expect(adapter.reply("test")).resolves.not.toThrow();
    await expect(adapter.getGuild()).resolves.not.toThrow();
    await expect(adapter.getAuthorVoiceChannel()).resolves.not.toThrow();
    expect(adapter.author).not.toThrow();
  });

  const validate_string = [
    {
      name: "query",
      description: "What to search for",
      required: true,
      type: "STRING",
    },
  ];
  const validate_number = [
    {
      name: "query",
      description: "What to search for",
      required: true,
      type: "INTEGER",
    },
  ];
  const validate_boolean = [
    {
      name: "query",
      description: "What to search for",
      required: true,
      type: "BOOLEAN",
    },
  ];
  const tests = [
    // OK string
    ["?play test", validate_string, [{ type: "STRING", value: "test" }]],
    ["?play test multiple words", validate_string, [{ type: "STRING", value: "test multiple words" }]],
    // Ok boolean
    ["?play true", validate_boolean, [{ type: "BOOLEAN", value: true }]],
    ["?play True", validate_boolean, [{ type: "BOOLEAN", value: true }]],
    ["?play false", validate_boolean, [{ type: "BOOLEAN", value: false }]],
    ["?play False", validate_boolean, [{ type: "BOOLEAN", value: false }]],
    //Ok number
    ["?play 5", validate_number, [{ type: "INTEGER", value: 5 }]],
    ["?play -5", validate_number, [{ type: "INTEGER", value: -5 }]],
    // Wrong type
    ["?play -5", validate_boolean, "Error"],
    ["?play 5", validate_string, "Error"],
    ["?play true", validate_string, "Error"],
  ];
  // This is much more complex, as we are trying to micmic the arg parsing done in the interaction part
  describe.each(tests)(
    "Arg parsing",
    (content: string, schema: any, expected) => {
      beforeEach(() => {
        const nullMessage = Substitute.for<Message>();
        console.log(content);
        nullMessage.content.returns(content);
        adapter = new MessageAdapter(Substitute.for<Client>(), nullMessage);
      });
      it("Args parsing", () => {
        // If we're expecting an error, test the exception
        if (expected === "Error") {
          expect(() =>
            adapter.getArgs(schema as unknown as ApplicationCommandOption[])
          ).toThrow();
        }
        // Else test the schema
        else {
          expect(
            adapter
              .getArgs(schema as unknown as ApplicationCommandOption[])
              .toJSON()
          ).toMatchObject(expected);
        }
      });
    }
  );
});
