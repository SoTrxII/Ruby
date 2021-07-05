import { Readable } from "stream";

/**
 * Search engine for the Jubebox
 */
export interface IEngine {
    /**
     * Get a playable stream for a specific search
     * @param query 
     */
    getPlayableStream(query : string): Promise<Readable>;
    
    /**
     * Search for the first url corresponding to the search query 
     * @param query 
     */
    search(query: string): Promise<string>;
}