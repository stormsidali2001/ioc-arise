import { ICreateUserInputPort } from '../IInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { User, CreateUserData } from '../entities/User';
import { ICreateUserOutputPort  } from '../IOutputPort';

export class CreateUserUseCase implements ICreateUserInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: ICreateUserOutputPort
  ) {}

  async execute(userData: CreateUserData): Promise<User> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        this.outputPort.presentError('User with this email already exists');
        throw new Error('User already exists');
      }

      // Create new user
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: userData.email,
        name: userData.name,
        createdAt: new Date()
      };

      await this.userRepository.save(user);
      this.outputPort.presentSuccess(user);
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
      throw error;
    }
  }
}