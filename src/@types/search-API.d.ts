import { youtube_v3 } from "googleapis";
import Schema$SearchResult = youtube_v3.Schema$SearchResult;

export interface SearchAPI {
  search(
    query: string,
    maxResults: number
  ): Promise<Array<Schema$SearchResult>>;
  searchFirstURL(query: string): Promise<string>;
  isProperLink(url: string): boolean;
}
