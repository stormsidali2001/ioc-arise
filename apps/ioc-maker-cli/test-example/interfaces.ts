// Test interfaces for the IoC container generator

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface IEmailService {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export interface IUserService {
  createUser(userData: CreateUserData): Promise<User>;
  getUserById(id: string): Promise<User | null>;
}

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface CreateUserData {
  email: string;
  name: string;
}