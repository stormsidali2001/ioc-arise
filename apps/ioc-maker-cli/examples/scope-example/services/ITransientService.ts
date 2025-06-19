export interface ITransientService {
  getInstanceId(): string;
  processData(data: string): string;
  getCreationTime(): Date;
  performCalculation(a: number, b: number): number;
}