// User module's GetItemUseCase - retrieves user profile items
export class GetItemUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(id: string): Promise<{ name: string; description: string } | null> {
    console.log(`Getting user item: ${id}`);
    // Logic for retrieving user-related items
    return await this.userRepository.getUserItem(id);
  }
}

// Interface for user repository
export interface IUserRepository {
  getUserItem(id: string): Promise<{ name: string; description: string } | null>;
}