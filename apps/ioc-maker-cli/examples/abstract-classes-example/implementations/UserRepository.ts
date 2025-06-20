import { AbstractRepository } from '../abstracts/AbstractRepository';
import { User } from '../entities/User';

export class UserRepository extends AbstractRepository {
  protected tableName = 'users';
  private users: User[] = [];
  
  async findById(id: string): Promise<User | null> {
    this.log(`Finding user by ID: ${id}`);
    return this.users.find(user => user.id === id) || null;
  }
  
  async findByEmail(email: string): Promise<User | null> {
    this.log(`Finding user by email: ${email}`);
    return this.users.find(user => user.email === email) || null;
  }
  
  async save(user: User): Promise<User> {
    this.log(`Saving user: ${user.name}`);
    const existingIndex = this.users.findIndex(u => u.id === user.id);
    
    if (existingIndex >= 0) {
      this.users[existingIndex] = { ...user, updatedAt: new Date() };
      return this.users[existingIndex];
    } else {
      const newUser = { ...user, createdAt: new Date(), updatedAt: new Date() };
      this.users.push(newUser);
      return newUser;
    }
  }
  
  async delete(id: string): Promise<boolean> {
    this.log(`Deleting user: ${id}`);
    const initialLength = this.users.length;
    this.users = this.users.filter(user => user.id !== id);
    return this.users.length < initialLength;
  }
}