import { Todo } from './Todo';

export interface ITodoRepository {
  findById(id: string): Promise<Todo | null>;
  findByUserId(userId: string): Promise<Todo[]>;
  findAll(): Promise<Todo[]>;
  create(title: string, userId: string): Promise<Todo>;
  update(id: string, title?: string, completed?: boolean): Promise<Todo | null>;
  delete(id: string): Promise<boolean>;
}