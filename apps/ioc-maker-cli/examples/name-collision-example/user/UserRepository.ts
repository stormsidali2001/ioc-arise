import { IUserRepository } from './CreateItemUseCase';

export class UserRepository implements IUserRepository {
  private items: Map<string, { name: string; description: string }> = new Map();

  async saveUserItem(item: { name: string; description: string }): Promise<void> {
    console.log(`UserRepository: Saving user item - ${item.name}: ${item.description}`);
    const id = Math.random().toString(36).substr(2, 9);
    this.items.set(id, item);
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async updateUserItem(id: string, item: { name: string; description: string }): Promise<void> {
    console.log(`UserRepository: Updating user item ${id} - ${item.name}: ${item.description}`);
    this.items.set(id, item);
    // Simulate database update
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async deleteUserItem(id: string): Promise<void> {
    console.log(`UserRepository: Deleting user item ${id}`);
    this.items.delete(id);
    // Simulate database delete
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  async getUserItem(id: string): Promise<{ name: string; description: string } | null> {
    console.log(`UserRepository: Getting user item ${id}`);
    const item = this.items.get(id);
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));
    return item || null;
  }

  async listUserItems(): Promise<{ id: string; name: string; description: string }[]> {
    console.log('UserRepository: Listing all user items');
    const result = Array.from(this.items.entries()).map(([id, item]) => ({ id, ...item }));
    // Simulate database query
    await new Promise(resolve => setTimeout(resolve, 100));
    return result;
  }
}