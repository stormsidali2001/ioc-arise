import { User } from './User';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(name: string, email: string): Promise<User>;
  delete(id: string): Promise<boolean>;
}