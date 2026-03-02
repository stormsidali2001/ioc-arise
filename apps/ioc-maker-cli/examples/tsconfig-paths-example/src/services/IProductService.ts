export interface IProductService {
  getProduct(id: string): string | null;
  addProduct(id: string, name: string): void;
  listProducts(): string[];
}
