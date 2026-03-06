import { ILogger, AppConfig } from '../config/appConfig';
import { SentryLogger, ConsoleLogger } from './Loggers';

/**
 * @factory
 */
export function createLogger(config: AppConfig): ILogger {
    if (config.env === 'production') {
        return new SentryLogger();
    }
    return new ConsoleLogger();
}
