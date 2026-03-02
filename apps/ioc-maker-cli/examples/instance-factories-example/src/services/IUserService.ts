export interface IUserService {
  listUsers(): Promise<{ id: string; name: string }[]>;
  getUser(id: string): Promise<{ id: string; name: string } | null>;
  createUser(name: string): Promise<{ id: string; name: string }>;
}
