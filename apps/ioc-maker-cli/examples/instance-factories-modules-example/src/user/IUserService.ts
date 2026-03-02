export interface IUserService {
  listUsers(): { id: string; name: string }[];
  getUser(id: string): { id: string; name: string } | null;
  createUser(name: string): { id: string; name: string };
}
