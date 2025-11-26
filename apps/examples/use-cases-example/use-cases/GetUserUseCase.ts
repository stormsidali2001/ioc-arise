import { IUserRepository } from '../repositories/IUserRepository';

// Another use case class that does NOT implement an interface
// It should be included in the container because it's used as a dependency
export class GetUserUseCase {
  constructor(private userRepository: IUserRepository) {}

  async execute(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    
    if (user) {
      console.log(`Found user: ${user.name} (${user.email})`);
    } else {
      console.log(`User with ID ${userId} not found`);
    }
  }
}