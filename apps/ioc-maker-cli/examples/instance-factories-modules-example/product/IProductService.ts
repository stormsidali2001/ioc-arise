export interface IProductService {
  listProducts(): { id: string; name: string; price: number }[];
  getProduct(id: string): { id: string; name: string; price: number } | null;
  addProduct(name: string, price: number): { id: string; name: string; price: number };
}
