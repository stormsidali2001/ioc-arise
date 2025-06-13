import { CreateItemUseCase } from './CreateItemUseCase';
import { UpdateItemUseCase } from './UpdateItemUseCase';
import { DeleteItemUseCase } from './DeleteItemUseCase';
import { GetItemUseCase } from './GetItemUseCase';
import { ListItemsUseCase } from './ListItemsUseCase';

export class ProductController {
  constructor(
    private createItemUseCase: CreateItemUseCase,
    private updateItemUseCase: UpdateItemUseCase,
    private deleteItemUseCase: DeleteItemUseCase,
    private getItemUseCase: GetItemUseCase,
    private listItemsUseCase: ListItemsUseCase
  ) {}

  async createProduct(name: string, price: number, category: string): Promise<void> {
    console.log('ProductController: Creating product...');
    await this.createItemUseCase.execute({ name, price, category });
  }

  async updateProduct(id: string, name: string, price: number, category: string): Promise<void> {
    console.log('ProductController: Updating product...');
    await this.updateItemUseCase.execute(id, { name, price, category });
  }

  async deleteProduct(id: string): Promise<void> {
    console.log('ProductController: Deleting product...');
    await this.deleteItemUseCase.execute(id);
  }

  async getProduct(id: string): Promise<{ name: string; price: number; category: string } | null> {
    console.log('ProductController: Getting product...');
    return await this.getItemUseCase.execute(id);
  }

  async listProducts(): Promise<{ id: string; name: string; price: number; category: string }[]> {
    console.log('ProductController: Listing products...');
    return await this.listItemsUseCase.execute();
  }
}