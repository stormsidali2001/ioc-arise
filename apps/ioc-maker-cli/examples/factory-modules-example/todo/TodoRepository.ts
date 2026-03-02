import { ITodoRepository } from './ITodoRepository';

/**
 * @scope singleton
 */
export class TodoRepository implements ITodoRepository {
  private store = new Map<string, string[]>();

  add(userId: string, title: string): void {
    const todos = this.store.get(userId) ?? [];
    todos.push(title);
    this.store.set(userId, todos);
  }

  listByUser(userId: string): string[] {
    return this.store.get(userId) ?? [];
  }
}
