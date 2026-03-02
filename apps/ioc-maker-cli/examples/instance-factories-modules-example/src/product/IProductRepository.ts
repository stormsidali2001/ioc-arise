export interface IProductRepository {
  findAll(): { id: string; name: string; price: number }[];
  findById(id: string): { id: string; name: string; price: number } | null;
  save(product: { id: string; name: string; price: number }): void;
}
