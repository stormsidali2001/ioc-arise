// User module's UpdateItemUseCase - updates user profile items
export class UpdateItemUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string, itemData: { name: string; description: string }): Promise<void> {
    console.log(`Updating user item: ${id} - ${itemData.name}`);
    // Logic for updating user-related items
    await this.userRepository.updateUserItem(id, itemData);
  }
}

// Interface for user repository
export interface IUserRepository {
  updateUserItem(id: string, item: { name: string; description: string }): Promise<void>;
}