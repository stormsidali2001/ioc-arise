import { UserRepository } from './implementations/UserRepository';
import { UserUseCase } from './use-cases/UserUseCase';
function createUserModuleContainer() {

  let userUseCase: UserUseCase | undefined;
  let userRepository: UserRepository | undefined;

  const getUserUseCase = (): UserUseCase => {
    if (!userUseCase) {
      userUseCase = new UserUseCase(getUserRepository());
    }
    return userUseCase;
  };
  const getUserRepository = (): UserRepository => {
    if (!userRepository) {
      userRepository = new UserRepository();
    }
    return userRepository;
  };

  return {
        get UserRepository(): UserRepository {
          return getUserRepository();
        },
        get AbstractUserRepository(): UserRepository {
          return getUserRepository();
        },
        get UserUseCase(): UserUseCase {
          return getUserUseCase();
        }
  };
}
export { createUserModuleContainer };
export type UserModuleContainer = ReturnType<typeof createUserModuleContainer>;