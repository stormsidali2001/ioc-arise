import { ILogger } from '../config/appConfig';

export class ConsoleLogger implements ILogger {
    log(message: string) {
        console.log(`[Console] ${message}`);
    }
}

export class FileLogger implements ILogger {
    log(message: string) {
        console.log(`[File] ${message}`);
    }
}

export class SentryLogger implements ILogger {
    log(message: string) {
        console.log(`[Sentry] ${message}`);
    }
}
