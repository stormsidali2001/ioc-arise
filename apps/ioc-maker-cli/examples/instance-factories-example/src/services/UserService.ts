import { IUserRepository } from '../repositories/IUserRepository';
import { IUserService } from './IUserService';

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async listUsers() {
    return this.userRepository.findAll();
  }

  async getUser(id: string) {
    return this.userRepository.findById(id);
  }

  async createUser(name: string) {
    const user = { id: Math.random().toString(36).slice(2), name };
    await this.userRepository.save(user);
    return user;
  }
}
