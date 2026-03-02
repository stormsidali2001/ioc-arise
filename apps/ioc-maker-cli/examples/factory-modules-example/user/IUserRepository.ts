export interface IUserRepository {
  findById(id: string): string | null;
  save(id: string, name: string): void;
}
