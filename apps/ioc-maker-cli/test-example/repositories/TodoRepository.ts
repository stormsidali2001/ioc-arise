import { ITodoRepository } from './ITodoRepository';
import { Todo, UpdateTodoData } from '../entities/Todo';

export class TodoRepository implements ITodoRepository {
  private todos: Map<string, Todo> = new Map();

  constructor() {
    // Initialize with some mock data
    const mockTodo: Todo = {
      id: '1',
      title: 'Learn Clean Architecture',
      description: 'Study the principles of clean architecture and implement a sample project',
      completed: false,
      userId: '1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    };
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
      const updatedTodo: Todo = {
        ...existingTodo,
        ...updateData,
        updatedAt: new Date()
      };
      this.todos.set(id, updatedTodo);
      console.log('Todo updated in repository:', updatedTodo);
    }
  }

  async delete(id: string): Promise<void> {
    this.todos.delete(id);
    console.log('Todo deleted from repository:', id);
  }

  async findByUserId(userId: string): Promise<Todo[]> {
    const userTodos: Todo[] = [];
    for (const todo of this.todos.values()) {
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