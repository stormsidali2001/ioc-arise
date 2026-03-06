export interface AppConfig {
    env: string;
    getEnv(): string;
}

/**
 * @value
 */
export const appConfig: AppConfig = {
    env: 'production',
    getEnv() { return this.env; }
};

export interface ILogger {
    log(message: string): void;
}
