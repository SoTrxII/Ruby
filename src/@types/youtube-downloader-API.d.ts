import { downloadOptions, videoInfo } from "ytdl-core";
import { Readable } from "stream";

export interface DownloadAPI {
  download(url: string, options?: downloadOptions): Promise<Readable>;
  getInfo(url: string): Promise<videoInfo>;
}
