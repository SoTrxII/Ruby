/**
 * Unified way to query anything to a provider
 */
import { injectable } from "inversify";

@injectable()
export abstract class SearchService {
  /**
   * Search for the first track matching the given query
   * @param query search text
   * @returns url of the first matching video
   */
  abstract async getFirst(query: string): Promise<string>;
}
