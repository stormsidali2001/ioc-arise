import { UserService } from './user/UserService';
import { UserRepository } from './user/UserRepository';
function createUserModuleContainer() {

  let userService: UserService | undefined;
  let userRepository: UserRepository | undefined;

  const getUserService = (): UserService => {
    if (!userService) {
      userService = new UserService(getUserRepository());
    }
    return userService;
  };
  const getUserRepository = (): UserRepository => {
    if (!userRepository) {
      userRepository = new UserRepository();
    }
    return userRepository;
  };

  return {
        get UserService(): UserService {
          return getUserService();
        },
        get IUserService(): UserService {
          return getUserService();
        },
        get UserRepository(): UserRepository {
          return getUserRepository();
        },
        get IUserRepository(): UserRepository {
          return getUserRepository();
        }
  };
}
export { createUserModuleContainer };
export type UserModuleContainer = ReturnType<typeof createUserModuleContainer>;