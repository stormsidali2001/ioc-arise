import { Todo, CreateTodoData, UpdateTodoData } from '../entities/Todo';
import { ITodoRepository } from './ITodoRepository';

/**
 * @scope singleton
 */
export class InMemoryTodoRepository implements ITodoRepository {
  private todos: Map<string, Todo> = new Map();

  async create(data: CreateTodoData): Promise<Todo> {
    const todo = new Todo(data);
    this.todos.set(todo.id, todo);
    console.log('Todo created in memory:', todo.toJSON());
    return todo;
  }

  async findById(id: string): Promise<Todo | null> {
    const todo = this.todos.get(id) || null;
    console.log('Todo found by ID:', id, todo ? todo.toJSON() : 'not found');
    return todo;
  }

  async findAll(): Promise<Todo[]> {
    const todos = Array.from(this.todos.values());
    console.log('All todos retrieved from memory:', todos.length, 'items');
    return todos;
  }

  async update(id: string, data: UpdateTodoData): Promise<Todo | null> {
    const todo = this.todos.get(id);
    if (!todo) {
      console.log('Todo not found for update:', id);
      return null;
    }
    
    todo.update(data);
    console.log('Todo updated in memory:', todo.toJSON());
    return todo;
  }

  async delete(id: string): Promise<boolean> {
    const deleted = this.todos.delete(id);
    console.log('Todo deleted from memory:', id, deleted ? 'success' : 'not found');
    return deleted;
  }

  async clear(): Promise<void> {
    const count = this.todos.size;
    this.todos.clear();
    console.log('Cleared all todos from memory:', count, 'items removed');
  }
}