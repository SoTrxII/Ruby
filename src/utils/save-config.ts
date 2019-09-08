import { promises } from "fs";
import { GlobalExt } from "../@types/global";
declare const global: GlobalExt;

/**
 * @summary Save the changes made to config.json
 * @returns  Resolve when done
 */
// tslint:disable-next-line:only-arrow-functions
export async function saveConfig(): Promise<void> {
  // tslint:disable-next-line:no-null-keyword
  await promises.writeFile(
    "config.json",
    JSON.stringify(global.Config, null, 2),
    "utf8"
  );
}
/**
 * @summary Overwrite databaseConfig with the given Object
 * @returns Resolve when done
 */
// tslint:disable-next-line:only-arrow-functions
export async function saveDatabaseConfig(
  databaseConfig: Record<string, any>
): Promise<void> {
  // tslint:disable-next-line:no-null-keyword
  await promises.writeFile(
    "database/config/config.json",
    JSON.stringify(databaseConfig, null, 2)
  );
}
