export interface ITodoRepository {
  add(userId: string, title: string): void;
  listByUser(userId: string): string[];
}
