// DTOs for Todo clean architecture - no entity dependencies

export interface CreateTodoRequestDTO {
  title: string;
  description: string;
  userId: string;
}

export interface UpdateTodoRequestDTO {
  id: string;
  title?: string;
  description?: string;
  completed?: boolean;
}

export interface TodoResponseDTO {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  createdAt: string; // ISO string instead of Date object
  updatedAt: string; // ISO string instead of Date object
}

export interface GetTodoRequestDTO {
  id: string;
}

export interface GetTodosByUserRequestDTO {
  userId: string;
}

export interface DeleteTodoRequestDTO {
  id: string;
}