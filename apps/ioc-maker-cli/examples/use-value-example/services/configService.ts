import { IConfigService } from './IConfigService';

/**
 * @value
 */
export const configService: IConfigService = {
  getApiUrl: () => 'https://api.example.com',
  getTimeout: () => 5000,
  getEnvironment: () => process.env.NODE_ENV || 'development',
};

