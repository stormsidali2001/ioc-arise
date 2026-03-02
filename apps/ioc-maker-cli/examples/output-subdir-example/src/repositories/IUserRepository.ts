export interface User {
  id: string;
  name: string;
  email: string;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<boolean>;
}
