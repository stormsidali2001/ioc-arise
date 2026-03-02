export interface IProductRepository {
  findById(id: string): string | null;
  save(id: string, name: string): void;
  list(): string[];
}
