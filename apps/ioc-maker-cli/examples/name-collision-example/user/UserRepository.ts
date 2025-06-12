import { IUserRepository } from './CreateItemUseCase';

export class UserRepository implements IUserRepository {
  async saveUserItem(item: { name: string; description: string }): Promise<void> {
    console.log(`UserRepository: Saving user item - ${item.name}: ${item.description}`);
    // Simulate database save
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}