import { IUserRepository } from './IUserRepository';

export class UserRepository implements IUserRepository {
  getUser(id: string): string {
    return `User-${id}`;
  }
}

