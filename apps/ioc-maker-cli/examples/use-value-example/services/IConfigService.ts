export interface IConfigService {
  getApiUrl(): string;
  getTimeout(): number;
  getEnvironment(): string;
}

