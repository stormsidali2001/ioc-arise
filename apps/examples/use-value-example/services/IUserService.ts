export interface IUserService {
  getUser(id: string): string;
  createUser(data: { name: string; email: string }): { id: string; name: string; email: string };
}

