import { TodoResponseDTO } from '../dtos/TodoDTOs';

export interface ICreateTodoOutputPort {
  presentSuccess(todo: TodoResponseDTO): void;
  presentError(error: string): void;
}

export interface IGetTodoOutputPort {
  presentTodo(todo: TodoResponseDTO): void;
  presentNotFound(): void;
  presentError(error: string): void;
}

export interface IGetTodosByUserOutputPort {
  presentTodos(todos: TodoResponseDTO[]): void;
  presentError(error: string): void;
}

export interface IUpdateTodoOutputPort {
  presentSuccess(todo: TodoResponseDTO): void;
  presentNotFound(): void;
  presentError(error: string): void;
}

export interface IDeleteTodoOutputPort {
  presentSuccess(): void;
  presentNotFound(): void;
  presentError(error: string): void;
}