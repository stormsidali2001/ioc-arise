import { IUserService } from './IUserService';

export const userService: IUserService = {
  getUser: (id: string) => {
    return `User-${id}`;
  },
  createUser: (data: { name: string; email: string }) => {
    return {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
    };
  },
};

