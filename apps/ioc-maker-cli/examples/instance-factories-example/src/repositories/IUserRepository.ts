export interface IUserRepository {
  findAll(): Promise<{ id: string; name: string }[]>;
  findById(id: string): Promise<{ id: string; name: string } | null>;
  save(user: { id: string; name: string }): Promise<void>;
}
