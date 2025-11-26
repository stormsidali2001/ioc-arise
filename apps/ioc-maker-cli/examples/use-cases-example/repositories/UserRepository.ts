import { IUserRepository, User } from './IUserRepository';

export class UserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();

  constructor() {
    // Add some sample data
    const user1: User = { id: '1', name: 'John Doe', email: 'john@example.com' };
    const user2: User = { id: '2', name: 'Jane Smith', email: 'jane@example.com' };
    this.users.set(user1.id, user1);
    this.users.set(user2.id, user2);
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async save(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async findAll(): Promise<User[]> {
    return Array.from(this.users.values());
  }
}