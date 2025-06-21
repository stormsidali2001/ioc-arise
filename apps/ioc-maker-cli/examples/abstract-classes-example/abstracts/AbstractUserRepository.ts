import { User } from '../entities/User';

export abstract class AbstractUserRepository {
  protected abstract tableName: string;
  
  abstract findById(id: string): Promise<User | null>;
  abstract findByEmail(email: string): Promise<User | null>;
  abstract save(user: User): Promise<User>;
  abstract delete(id: string): Promise<boolean>;
  
  protected log(message: string): void {
    console.log(`[${this.tableName}] ${message}`);
  }
}