export interface ISingletonService {
  getInstanceId(): string;
  incrementCounter(): number;
  getCounter(): number;
  log(message: string): void;
  getCreationTime(): Date;
}