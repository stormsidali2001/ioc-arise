export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  findAll(): Promise<User[]>;
}

export interface User {
  id: string;
  name: string;
  email: string;
}