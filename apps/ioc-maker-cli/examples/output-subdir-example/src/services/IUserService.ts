import { User } from '../repositories/IUserRepository';

export interface IUserService {
  getUser(id: string): Promise<User | null>;
  listUsers(): Promise<User[]>;
  createUser(name: string, email: string): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
}
