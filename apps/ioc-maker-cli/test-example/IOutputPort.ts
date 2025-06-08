import { User } from './entities/User';

export interface ICreateUserOutputPort {
  presentSuccess(user: User): void;
  presentError(error: string): void;
}

export interface IGetUserOutputPort {
  presentUser(user: User): void;
  presentNotFound(): void;
  presentError(error: string): void;
}

export interface IDeleteUserOutputPort {
  presentSuccess(): void;
  presentNotFound(): void;
  presentError(error: string): void;
}