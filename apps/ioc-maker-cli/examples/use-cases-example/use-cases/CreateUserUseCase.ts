import { IUserRepository } from '../repositories/IUserRepository';
import { IEmailService } from '../services/IEmailService';

// This is a use case class that does NOT implement an interface
// It should be included in the container because it's used as a dependency


export class CreateUserUseCase {

  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService
  ) {}

  async execute(name: string, email: string): Promise<void> {
    const user = {
      id: Date.now().toString(),
      name,
      email
    };

    await this.userRepository.save(user);
    await this.emailService.sendWelcomeEmail(user.email, user.name);
    
    console.log(`User created: ${user.name} (${user.email})`);
  }
}