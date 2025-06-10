import { CreateTodoRequestDTO, UpdateTodoRequestDTO, GetTodoRequestDTO, GetTodosByUserRequestDTO, DeleteTodoRequestDTO } from '../dtos/TodoDTOs';

export interface ICreateTodoInputPort {
  execute(todoData: CreateTodoRequestDTO): Promise<void>;
}

export interface IGetTodoInputPort {
  execute(request: GetTodoRequestDTO): Promise<void>;
}

export interface IGetTodosByUserInputPort {
  execute(request: GetTodosByUserRequestDTO): Promise<void>;
}

export interface IUpdateTodoInputPort {
  execute(request: UpdateTodoRequestDTO): Promise<void>;
}

export interface IDeleteTodoInputPort {
  execute(request: DeleteTodoRequestDTO): Promise<void>;
}