import { Todo, CreateTodoData, UpdateTodoData } from '../entities/Todo';

export interface ITodoService {
  createTodo(data: CreateTodoData): Promise<Todo>;
  getTodo(id: string): Promise<Todo>;
  getAllTodos(): Promise<Todo[]>;
  updateTodo(id: string, data: UpdateTodoData): Promise<Todo>;
  deleteTodo(id: string): Promise<void>;
  markAsCompleted(id: string): Promise<Todo>;
  markAsIncomplete(id: string): Promise<Todo>;
  getCompletedTodos(): Promise<Todo[]>;
  getIncompleteTodos(): Promise<Todo[]>;
  clearAllTodos(): Promise<void>;
}