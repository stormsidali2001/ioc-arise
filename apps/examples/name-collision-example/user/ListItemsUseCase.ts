// User module's ListItemsUseCase - lists all user profile items
export class ListItemsUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(): Promise<{ id: string; name: string; description: string }[]> {
    console.log('Listing all user items');
    // Logic for listing user-related items
    return await this.userRepository.listUserItems();
  }
}

// Interface for user repository
export interface IUserRepository {
  listUserItems(): Promise<{ id: string; name: string; description: string }[]>;
}