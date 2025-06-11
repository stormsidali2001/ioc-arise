import { Todo } from './Todo';
import { ITodoRepository } from './ITodoRepository';

/**
 * @scope singleton
 */
export class TodoRepository implements ITodoRepository {
  private todos = new Map<string, Todo>();
  private nextId = 1;

  constructor() {
    // Add some sample data
    const todo1 = new Todo('1', 'Learn IoC Arise', false, '1');
    const todo2 = new Todo('2', 'Build awesome apps', false, '1');
    const todo3 = new Todo('3', 'Write documentation', true, '2');
    this.todos.set(todo1.id, todo1);
    this.todos.set(todo2.id, todo2);
    this.todos.set(todo3.id, todo3);
    this.nextId = 4;
  }

  async findById(id: string): Promise<Todo | null> {
    return this.todos.get(id) || null;
  }

  async findByUserId(userId: string): Promise<Todo[]> {
    return Array.from(this.todos.values()).filter(todo => todo.userId === userId);
  }

  async findAll(): Promise<Todo[]> {
    return Array.from(this.todos.values());
  }

  async create(title: string, userId: string): Promise<Todo> {
    const todo = new Todo(this.nextId.toString(), title, false, userId);
    this.todos.set(todo.id, todo);
    this.nextId++;
    return todo;
  }

  async update(id: string, title?: string, completed?: boolean): Promise<Todo | null> {
    const todo = this.todos.get(id);
    if (!todo) return null;

    if (title !== undefined) todo.title = title;
    if (completed !== undefined) todo.completed = completed;
    
    return todo;
  }

  async delete(id: string): Promise<boolean> {
    return this.todos.delete(id);
  }
}