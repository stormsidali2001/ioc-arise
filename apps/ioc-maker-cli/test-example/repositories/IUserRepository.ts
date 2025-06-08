import { User, CreateUserData } from '../entities/User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}