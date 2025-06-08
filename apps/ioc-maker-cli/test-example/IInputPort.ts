import { CreateUserRequestDTO, UserResponseDTO, GetUserRequestDTO, DeleteUserRequestDTO } from './dtos/UserDTOs';

export interface ICreateUserInputPort {
  execute(userData: CreateUserRequestDTO): Promise<void>;
}

export interface IGetUserInputPort {
  execute(request: GetUserRequestDTO): Promise<void>;
}

export interface IDeleteUserInputPort {
  execute(request: DeleteUserRequestDTO): Promise<void>;
}