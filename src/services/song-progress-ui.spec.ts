import "reflect-metadata";
import { container } from "../inversify.config";
import { TYPES } from "../types";
import { Arg, Substitute } from "@fluffy-spoon/substitute";
import { Client, ClientUser, Presence } from "discord.js";
import { SongProgressUi } from "./song-progress-ui";

describe("Song Progress UI", () => {
  const nullClient = Substitute.for<Client>();
  let ui: SongProgressUi;
  const bSong = {
    url: "hh",
    description: " blah",
    author: "test",
    duration: 1,
    title: "test",
  };
  beforeAll(() => {
    container.snapshot();
    nullClient.user = Substitute.for<ClientUser>();
    // Replacing Discord's client by a mock
    container.rebind(TYPES.CLIENT_FACTORY).toConstantValue(() => nullClient);
    // Rebinding the progress ui, as it was bound in a singleton
    container.rebind(TYPES.SONG_PROGRESS_UI).to(SongProgressUi);
  });
  beforeEach(() => {
    ui = container.get(TYPES.SONG_PROGRESS_UI);
  });
  afterAll(() => {
    container.restore();
  });

  it("Update the client activity", async () => {
    ui.start(bSong, 500);
    await new Promise((res) => setTimeout(res, 500));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    expect((nullClient.user as any).received().setActivity(Arg.any()));
  });

  it("Should stop the updating process as soon as possible", async () => {
    ui.start(bSong, 5000);
    await new Promise((res) => setTimeout(res, 500));
    // Stopping the client ui sj=hould be immediate
    ui.stop();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    expect(!(nullClient.user as any).received().setActivity(Arg.any()));
  });
});
