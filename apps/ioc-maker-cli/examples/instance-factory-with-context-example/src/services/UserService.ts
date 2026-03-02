import { IUserRepository } from '../repositories/IUserRepository';
import { IUserService } from './IUserService';

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  listUsers() {
    return this.userRepository.findAll();
  }

  getUser(id: string) {
    return this.userRepository.findById(id);
  }

  createUser(name: string) {
    const user = { id: Math.random().toString(36).slice(2), name };
    this.userRepository.save(user);
    return user;
  }
}
