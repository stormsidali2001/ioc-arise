export interface IUserRepository {
  findAll(): { id: string; name: string }[];
  findById(id: string): { id: string; name: string } | null;
  save(user: { id: string; name: string }): void;
}
