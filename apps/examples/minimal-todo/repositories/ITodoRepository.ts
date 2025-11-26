import { Todo, CreateTodoData, UpdateTodoData } from '../entities/Todo';

export interface ITodoRepository {
  create(data: CreateTodoData): Promise<Todo>;
  findById(id: string): Promise<Todo | null>;
  findAll(): Promise<Todo[]>;
  update(id: string, data: UpdateTodoData): Promise<Todo | null>;
  delete(id: string): Promise<boolean>;
  clear(): Promise<void>;
}