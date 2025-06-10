import { Todo, CreateTodoData, UpdateTodoData } from '../entities/Todo';

export interface ITodoRepository {
  findById(id: string): Promise<Todo | null>;
  save(todo: Todo): Promise<void>;
  update(id: string, updateData: UpdateTodoData): Promise<void>;
  delete(id: string): Promise<void>;
  findByUserId(userId: string): Promise<Todo[]>;
  findAll(): Promise<Todo[]>;
}