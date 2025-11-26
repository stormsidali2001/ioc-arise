import { ITodoRepository } from './ITodoRepository';

export class TodoRepository implements ITodoRepository {
  saveTodo(title: string): void {
    console.log(`Todo saved: ${title}`);
  }
}

