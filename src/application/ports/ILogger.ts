/**
 * Logger Port Interface
 * Defines contract for logging without tying to specific implementation
 */
export interface ILogger {
  debug(obj: unknown, msg?: string): void;
  debug(msg: string): void;

  info(obj: unknown, msg?: string): void;
  info(msg: string): void;

  warn(obj: unknown, msg?: string): void;
  warn(msg: string): void;

  error(obj: unknown, msg?: string): void;
  error(msg: string): void;

  fatal(obj: unknown, msg?: string): void;
  fatal(msg: string): void;
}
