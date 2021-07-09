/* eslint-disable @typescript-eslint/ban-types */
/**
 * Adapter pattern for logging.
 * Pino is being tested here, and should be swappable.
 */
import pinoC from "pino";
import { ILogger } from "../@types/logger";
import { injectable } from "inversify";

@injectable()
export class LoggerAdapter implements ILogger {
  private static readonly logger = pinoC({ level: "debug" });
  info(obj: Object, ...args: any): void;
  info(obj: string, ...args: any): void {
    LoggerAdapter.logger.info(obj, args);
  }

  log(obj: Object, ...args: any): void;
  log(obj: string, ...args: any): void {
    LoggerAdapter.logger.info(obj, args);
  }

  error(obj: Object, ...args: any): void;
  error(obj: string, ...args: any): void {
    LoggerAdapter.logger.error(obj, args);
  }

  warn(obj: Object, ...args: any): void;
  warn(obj: string, ...args: any): void {
    LoggerAdapter.logger.warn(obj, args);
  }

  debug(obj: Object, ...args: any): void;
  debug(obj: string, ...args: any): void {
    LoggerAdapter.logger.debug(obj, args);
  }
  trace(obj: Object, ...args: any): void;
  trace(obj: string, ...args: any): void {
    LoggerAdapter.logger.trace(obj, args);
  }

  fatal(obj: Object, ...args: any): void;
  fatal(obj: string, ...args: any): void {
    LoggerAdapter.logger.fatal(obj, args);
  }
}
