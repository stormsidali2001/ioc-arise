/**
 * Manual container setup demonstrating value registration
 * This is what you would write manually to use values with ioc-arise
 */
import { Container, Lifecycle } from 'ioc-arise';
import { appConfig, AppConfig } from './config/AppConfig';
import { API_VERSION, APP_NAME, databaseConfig, DatabaseConfig } from './config/constants';
import { Logger } from './services/Logger';
import { ApiClient } from './services/ApiClient';

// Create type registry for type-safe resolution
export interface ValueExampleRegistry {
    'AppConfig': AppConfig;
    'API_VERSION': string;
    'APP_NAME': string;
    'DatabaseConfig': DatabaseConfig;
    'ILogger': Logger;
    'IApiClient': ApiClient;
}

export const container = new Container<ValueExampleRegistry>();

// Register configuration object as value
container.register('AppConfig', {
    useValue: appConfig,
    lifecycle: Lifecycle.Singleton, // Values are always singleton by nature
});

// Register database config as value
container.register('DatabaseConfig', {
    useValue: databaseConfig,
    lifecycle: Lifecycle.Singleton,
});

// Register constants as values
container.register('API_VERSION', {
    useValue: API_VERSION,
    lifecycle: Lifecycle.Singleton,
});

container.register('APP_NAME', {
    useValue: APP_NAME,
    lifecycle: Lifecycle.Singleton,
});

// Register Logger with value dependencies
container.register('ILogger', {
    useClass: Logger,
    dependencies: ['AppConfig', 'APP_NAME'],
    lifecycle: Lifecycle.Singleton,
});

// Register ApiClient with both value and class dependencies
container.register('IApiClient', {
    useClass: ApiClient,
    dependencies: ['AppConfig', 'DatabaseConfig', 'ILogger', 'API_VERSION'],
    lifecycle: Lifecycle.Transient,
});

