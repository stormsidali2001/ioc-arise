import { User } from './User';

export interface IUserService {
  getUser(id: string): Promise<User | null>;
  getAllUsers(): Promise<User[]>;
  createUser(name: string, email: string): Promise<User>;
  deleteUser(id: string): Promise<boolean>;
}