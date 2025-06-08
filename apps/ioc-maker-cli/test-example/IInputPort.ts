import { User, CreateUserData } from './entities/User';

export interface ICreateUserInputPort {
  execute(userData: CreateUserData): Promise<User>;
}

export interface IGetUserInputPort {
  execute(id: string): Promise<User | null>;
}

export interface IDeleteUserInputPort {
  execute(id: string): Promise<void>;
}