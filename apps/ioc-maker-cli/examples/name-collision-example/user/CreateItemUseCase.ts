// User module's CreateItemUseCase - creates user profile items
export class CreateItemUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(itemData: { name: string; description: string }): Promise<void> {
    console.log(`Creating user item: ${itemData.name}`);
    // Logic for creating user-related items
    await this.userRepository.saveUserItem(itemData);
  }
}

// Simple interface for demonstration
export interface IUserRepository {
  saveUserItem(item: { name: string; description: string }): Promise<void>;
}