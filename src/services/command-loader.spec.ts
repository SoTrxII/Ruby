import "reflect-metadata";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { Substitute } from "@fluffy-spoon/substitute";
import { Client, Message } from "discord.js";
import { ICommand, IContext } from "../@types/ruby";
import { CommandsLoader } from "./commands-loader";
describe("Command loader", () => {
  let commandLoader: CommandsLoader;
  beforeAll(() => {
    container.snapshot();
    const nullClient = Substitute.for<Client>();
    // Replacing Discord's client by a mock
    container.rebind(TYPES.CLIENT_FACTORY).toConstantValue(() => nullClient);
    const nullContext = Substitute.for<IContext>();
    container.rebind(TYPES.CONTEXT_FACTORY).toConstantValue(() => nullContext);
    const nullCommand = Substitute.for<ICommand>();
    nullCommand.TRIGGER.returns("null");
    container.rebind(TYPES.COMMAND).toConstantValue(nullCommand);
    commandLoader = container.get(TYPES.COMMAND_LOADER);
  });

  afterAll(() => {
    container.restore();
  });

  //@TODO : Fix dis
  it.skip("Publish Commands", async () => {
    await expect(commandLoader.publishCommands()).resolves.not.toThrow();
  });

  it("run non existing command", async () => {
    await expect(
      commandLoader.run("", Substitute.for<Message>())
    ).rejects.toThrow();
  });

  it("run existing command", async () => {
    await expect(
      commandLoader.run("null", Substitute.for<Message>())
    ).resolves.not.toThrow();
  });
});
