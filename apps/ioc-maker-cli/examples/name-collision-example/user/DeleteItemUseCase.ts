// User module's DeleteItemUseCase - deletes user profile items
export class DeleteItemUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<void> {
    console.log(`Deleting user item: ${id}`);
    // Logic for deleting user-related items
    await this.userRepository.deleteUserItem(id);
  }
}

// Interface for user repository
export interface IUserRepository {
  deleteUserItem(id: string): Promise<void>;
}