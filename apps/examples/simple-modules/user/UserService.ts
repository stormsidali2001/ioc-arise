import { User } from './User';
import { IUserService } from './IUserService';
import { IUserRepository } from './IUserRepository';

/**
 * @scope singleton
 */
export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async getUser(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }

  async getAllUsers(): Promise<User[]> {
    return this.userRepository.findAll();
  }

  async createUser(name: string, email: string): Promise<User> {
    return this.userRepository.create(name, email);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.userRepository.delete(id);
  }
}