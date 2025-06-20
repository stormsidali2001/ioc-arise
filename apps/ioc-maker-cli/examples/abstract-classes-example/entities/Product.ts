export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  userId: string; // Reference to the user who created the product
  createdAt: Date;
  updatedAt: Date;
}