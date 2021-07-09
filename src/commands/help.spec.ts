import "reflect-metadata";
import { Arg, Substitute } from "@fluffy-spoon/substitute";
import { IContext } from "../@types/ruby";
import { Help } from "./help";

describe("Command : Help", () => {
  it("Retrieve help", async () => {
    // This is just checking for no infinite loops
    await new Help().run(Substitute.for<IContext>());
  });
});
