import { IUserRepository, User } from '../repositories/IUserRepository';
import { IUserService } from './IUserService';

/**
 * @scope singleton
 */
export class UserService implements IUserService {
  constructor(private readonly userRepository: IUserRepository) {}

  async getUser(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async listUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async createUser(name: string, email: string): Promise<User> {
    const user: User = {
      id: Math.random().toString(36).slice(2, 9),
      name,
      email,
    };
    await this.userRepository.save(user);
    return user;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}
