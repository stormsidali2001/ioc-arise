// DTOs for clean architecture - no entity dependencies

export interface CreateUserRequestDTO {
  email: string;
  name: string;
}

export interface UserResponseDTO {
  id: string;
  email: string;
  name: string;
  createdAt: string; // ISO string instead of Date object
}

export interface GetUserRequestDTO {
  id: string;
}

export interface DeleteUserRequestDTO {
  id: string;
}