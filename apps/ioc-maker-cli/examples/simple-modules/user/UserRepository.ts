import { User } from './User';
import { IUserRepository } from './IUserRepository';

/**
 * @scope singleton
 */
export class UserRepository implements IUserRepository {
  private users = new Map<string, User>();
  private nextId = 1;

  constructor() {
    // Add some sample data
    const user1 = new User('1', 'John Doe', 'john@example.com');
    const user2 = new User('2', 'Jane Smith', 'jane@example.com');
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
    this.nextId = 3;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async create(name: string, email: string): Promise<User> {
    const user = new User(this.nextId.toString(), name, email);
    this.users.set(user.id, user);
    this.nextId++;
    return user;
  }

  async delete(id: string): Promise<boolean> {
    return this.users.delete(id);
  }
}