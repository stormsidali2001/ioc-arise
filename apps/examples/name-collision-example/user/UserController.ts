import { CreateItemUseCase } from './CreateItemUseCase';
import { UpdateItemUseCase } from './UpdateItemUseCase';
import { DeleteItemUseCase } from './DeleteItemUseCase';
import { GetItemUseCase } from './GetItemUseCase';
import { ListItemsUseCase } from './ListItemsUseCase';

export class UserController {
  constructor(
    private createItemUseCase: CreateItemUseCase,
    private updateItemUseCase: UpdateItemUseCase,
    private deleteItemUseCase: DeleteItemUseCase,
    private getItemUseCase: GetItemUseCase,
    private listItemsUseCase: ListItemsUseCase
  ) {}

  async createUserItem(name: string, description: string): Promise<void> {
    console.log('UserController: Creating user item...');
    await this.createItemUseCase.execute({ name, description });
  }

  async updateUserItem(id: string, name: string, description: string): Promise<void> {
    console.log('UserController: Updating user item...');
    await this.updateItemUseCase.execute(id, { name, description });
  }

  async deleteUserItem(id: string): Promise<void> {
    console.log('UserController: Deleting user item...');
    await this.deleteItemUseCase.execute(id);
  }

  async getUserItem(id: string): Promise<{ name: string; description: string } | null> {
    console.log('UserController: Getting user item...');
    return await this.getItemUseCase.execute(id);
  }

  async listUserItems(): Promise<{ id: string; name: string; description: string }[]> {
    console.log('UserController: Listing user items...');
    return await this.listItemsUseCase.execute();
  }
}