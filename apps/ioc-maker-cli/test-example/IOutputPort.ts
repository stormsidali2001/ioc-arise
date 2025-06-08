import { UserResponseDTO } from './dtos/UserDTOs';

export interface ICreateUserOutputPort {
  presentSuccess(user: UserResponseDTO): void;
  presentError(error: string): void;
}

export interface IGetUserOutputPort {
  presentUser(user: UserResponseDTO): void;
  presentNotFound(): void;
  presentError(error: string): void;
}

export interface IDeleteUserOutputPort {
  presentSuccess(): void;
  presentNotFound(): void;
  presentError(error: string): void;
}