import { ILogger } from './ILogger';

/**
 * @value
 */
export const consoleLogger: ILogger = {
  info: (message) => console.log(`[INFO]  ${message}`),
  warn: (message) => console.warn(`[WARN]  ${message}`),
};
