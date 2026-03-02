import { ICache } from '../core/ICache';
import { IUserRepository } from './IUserRepository';
import { IUserService } from './IUserService';

export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private cache: ICache,
  ) {}

  listUsers() {
    return this.userRepository.findAll();
  }

  getUser(id: string) {
    const cached = this.cache.get(`user:${id}`);
    if (cached) return cached as { id: string; name: string };
    const user = this.userRepository.findById(id);
    if (user) this.cache.set(`user:${id}`, user);
    return user;
  }

  createUser(name: string) {
    const user = { id: Math.random().toString(36).slice(2), name };
    this.userRepository.save(user);
    this.cache.delete(`user:${user.id}`);
    return user;
  }
}
