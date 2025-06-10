import { ITodoRepository } from './ITodoRepository';
import { Todo, UpdateTodoData } from '../entities/Todo';

export class TodoRepository implements ITodoRepository {
  private todos: Map<string, Todo> = new Map();

  constructor() {
    // Initialize with some mock data
    const mockTodo = new Todo(
      '1',
      'Learn Clean Architecture',
      'Study the principles of clean architecture and implement a sample project',
      false,
      '1',
      new Date('2024-01-01'),
      new Date('2024-01-01')
    );
    this.todos.set(mockTodo.id, mockTodo);
  }

  async findById(id: string): Promise<Todo | null> {
    const todo = this.todos.get(id);
    return todo || null;
  }

  async save(todo: Todo): Promise<void> {
    this.todos.set(todo.id, todo);
    console.log('Todo saved to repository:', todo);
  }

  async update(id: string, updateData: UpdateTodoData): Promise<void> {
    const existingTodo = this.todos.get(id);
    if (existingTodo) {
      existingTodo.update(updateData);
      console.log('Todo updated in repository:', existingTodo);
    }
  }

  async delete(id: string): Promise<void> {
    this.todos.delete(id);
    console.log('Todo deleted from repository:', id);
  }

  async findByUserId(userId: string): Promise<Todo[]> {
    const userTodos: Todo[] = [];
    for (const todo of Array.from(this.todos.values())) {
      if (todo.userId === userId) {
        userTodos.push(todo);
      }
    }
    return userTodos;
  }

  async findAll(): Promise<Todo[]> {
    return Array.from(this.todos.values());
  }
}