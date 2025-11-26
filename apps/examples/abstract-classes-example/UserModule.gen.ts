import { UserUseCase } from './use-cases/UserUseCase';
import { UserRepository } from './implementations/UserRepository';
function createUserModuleContainer() {

  let userRepository: UserRepository | undefined;
  let userUseCase: UserUseCase | undefined;

  const getUserRepository = (): UserRepository => {
    if (!userRepository) {
      userRepository = new UserRepository();
    }
    return userRepository;
  };
  const getUserUseCase = (): UserUseCase => {
    if (!userUseCase) {
      userUseCase = new UserUseCase(getUserRepository());
    }
    return userUseCase;
  };

  return {
        get UserUseCase(): UserUseCase {
          return getUserUseCase();
        },
        get AbstractUserRepository(): UserRepository {
          return getUserRepository();
        }
  };
}
export { createUserModuleContainer };
export type UserModuleContainer = ReturnType<typeof createUserModuleContainer>;