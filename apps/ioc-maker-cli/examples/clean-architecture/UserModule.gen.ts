import { UserRepository } from './repositories/UserRepository';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { GetTodosByUserUseCase } from './use-cases/GetTodosByUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { GetUserPresenter } from './presenters/GetUserPresenter';
import { GetTodosByUserPresenter } from './presenters/GetTodosByUserPresenter';
import { DeleteUserPresenter } from './presenters/DeleteUserPresenter';
import { CreateUserPresenter } from './presenters/CreateUserPresenter';
function createUserModuleContainer() {
  const getUserPresenterFactory = (): GetUserPresenter => new GetUserPresenter();
  const getTodosByUserPresenterFactory = (): GetTodosByUserPresenter => new GetTodosByUserPresenter();
  const deleteUserPresenterFactory = (): DeleteUserPresenter => new DeleteUserPresenter();
  const createUserPresenterFactory = (): CreateUserPresenter => new CreateUserPresenter();

  let createUserUseCase: CreateUserUseCase | undefined;
  let deleteUserUseCase: DeleteUserUseCase | undefined;
  let getTodosByUserUseCase: GetTodosByUserUseCase | undefined;
  let getUserUseCase: GetUserUseCase | undefined;
  let userRepository: UserRepository | undefined;

  const getCreateUserUseCase = (): CreateUserUseCase => {
    if (!createUserUseCase) {
      createUserUseCase = new CreateUserUseCase(getUserRepository(), createUserPresenterFactory());
    }
    return createUserUseCase;
  };
  const getDeleteUserUseCase = (): DeleteUserUseCase => {
    if (!deleteUserUseCase) {
      deleteUserUseCase = new DeleteUserUseCase(getUserRepository(), deleteUserPresenterFactory());
    }
    return deleteUserUseCase;
  };
  const getGetTodosByUserUseCase = (): GetTodosByUserUseCase => {
    if (!getTodosByUserUseCase) {
      getTodosByUserUseCase = new GetTodosByUserUseCase(getUserRepository(), getTodosByUserPresenterFactory());
    }
    return getTodosByUserUseCase;
  };
  const getGetUserUseCase = (): GetUserUseCase => {
    if (!getUserUseCase) {
      getUserUseCase = new GetUserUseCase(getUserRepository(), getUserPresenterFactory());
    }
    return getUserUseCase;
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
        get IUserRepository(): UserRepository {
          return getUserRepository();
        },
        get GetUserUseCase(): GetUserUseCase {
          return getGetUserUseCase();
        },
        get IGetUserInputPort(): GetUserUseCase {
          return getGetUserUseCase();
        },
        get GetTodosByUserUseCase(): GetTodosByUserUseCase {
          return getGetTodosByUserUseCase();
        },
        get IGetTodosByUserInputPort(): GetTodosByUserUseCase {
          return getGetTodosByUserUseCase();
        },
        get DeleteUserUseCase(): DeleteUserUseCase {
          return getDeleteUserUseCase();
        },
        get IDeleteUserInputPort(): DeleteUserUseCase {
          return getDeleteUserUseCase();
        },
        get CreateUserUseCase(): CreateUserUseCase {
          return getCreateUserUseCase();
        },
        get ICreateUserInputPort(): CreateUserUseCase {
          return getCreateUserUseCase();
        },
        get GetUserPresenter(): GetUserPresenter {
          return getUserPresenterFactory();
        },
        get IGetUserOutputPort(): GetUserPresenter {
          return getUserPresenterFactory();
        },
        get GetTodosByUserPresenter(): GetTodosByUserPresenter {
          return getTodosByUserPresenterFactory();
        },
        get IGetTodosByUserOutputPort(): GetTodosByUserPresenter {
          return getTodosByUserPresenterFactory();
        },
        get DeleteUserPresenter(): DeleteUserPresenter {
          return deleteUserPresenterFactory();
        },
        get IDeleteUserOutputPort(): DeleteUserPresenter {
          return deleteUserPresenterFactory();
        },
        get CreateUserPresenter(): CreateUserPresenter {
          return createUserPresenterFactory();
        },
        get ICreateUserOutputPort(): CreateUserPresenter {
          return createUserPresenterFactory();
        }
  };
}
export { createUserModuleContainer };
export type UserModuleContainer = ReturnType<typeof createUserModuleContainer>;