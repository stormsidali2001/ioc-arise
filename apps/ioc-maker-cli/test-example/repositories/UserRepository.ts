import { IUserRepository } from './IUserRepository';
import { User } from '../entities/User';

export class UserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  constructor() {
    // Initialize with some mock data
    const mockUser: User = {
      id: '1',
      email: 'john@example.com',
      name: 'John Doe',
      createdAt: new Date('2024-01-01')
    };
    this.users.set(mockUser.id, mockUser);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    return user || null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
    console.log('User saved to repository:', user);
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    this.users.delete(id);
    console.log('User deleted from repository:', id);
  }
}