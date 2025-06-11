import { Todo } from './Todo';

export interface ITodoService {
  getTodo(id: string): Promise<Todo | null>;
  getTodosByUser(userId: string): Promise<Todo[]>;
  getAllTodos(): Promise<Todo[]>;
  createTodo(title: string, userId: string): Promise<Todo>;
  updateTodo(id: string, title?: string, completed?: boolean): Promise<Todo | null>;
  deleteTodo(id: string): Promise<boolean>;
}