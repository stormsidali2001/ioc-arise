import { UpdateTodoUseCase } from './use-cases/UpdateTodoUseCase';
import { GetTodoUseCase } from './use-cases/GetTodoUseCase';
import { DeleteTodoUseCase } from './use-cases/DeleteTodoUseCase';
import { CreateTodoUseCase } from './use-cases/CreateTodoUseCase';
import { TodoRepository } from './repositories/TodoRepository';
import { UpdateTodoPresenter } from './presenters/UpdateTodoPresenter';
import { GetTodoPresenter } from './presenters/GetTodoPresenter';
import { DeleteTodoPresenter } from './presenters/DeleteTodoPresenter';
import { CreateTodoPresenter } from './presenters/CreateTodoPresenter';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { GetTodosByUserUseCase } from './use-cases/GetTodosByUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { UserRepository } from './repositories/UserRepository';
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
        get UserRepository(): UserRepository {
          return getUserRepository();
        },
        get IUserRepository(): UserRepository {
          return getUserRepository();
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

function createTodoModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {
  const updateTodoPresenterFactory = (): UpdateTodoPresenter => new UpdateTodoPresenter();
  const getTodoPresenterFactory = (): GetTodoPresenter => new GetTodoPresenter();
  const deleteTodoPresenterFactory = (): DeleteTodoPresenter => new DeleteTodoPresenter();
  const createTodoPresenterFactory = (): CreateTodoPresenter => new CreateTodoPresenter();

  let createTodoUseCase: CreateTodoUseCase | undefined;
  let deleteTodoUseCase: DeleteTodoUseCase | undefined;
  let getTodoUseCase: GetTodoUseCase | undefined;
  let updateTodoUseCase: UpdateTodoUseCase | undefined;
  let todoRepository: TodoRepository | undefined;

  const getCreateTodoUseCase = (): CreateTodoUseCase => {
    if (!createTodoUseCase) {
      createTodoUseCase = new CreateTodoUseCase(userModuleContainer.IUserRepository, createTodoPresenterFactory());
    }
    return createTodoUseCase;
  };
  const getDeleteTodoUseCase = (): DeleteTodoUseCase => {
    if (!deleteTodoUseCase) {
      deleteTodoUseCase = new DeleteTodoUseCase(userModuleContainer.IUserRepository, getTodoRepository(), deleteTodoPresenterFactory());
    }
    return deleteTodoUseCase;
  };
  const getGetTodoUseCase = (): GetTodoUseCase => {
    if (!getTodoUseCase) {
      getTodoUseCase = new GetTodoUseCase(userModuleContainer.IUserRepository, getTodoRepository(), getTodoPresenterFactory());
    }
    return getTodoUseCase;
  };
  const getUpdateTodoUseCase = (): UpdateTodoUseCase => {
    if (!updateTodoUseCase) {
      updateTodoUseCase = new UpdateTodoUseCase(userModuleContainer.IUserRepository, getTodoRepository(), updateTodoPresenterFactory());
    }
    return updateTodoUseCase;
  };
  const getTodoRepository = (): TodoRepository => {
    if (!todoRepository) {
      todoRepository = new TodoRepository();
    }
    return todoRepository;
  };

  return {
        get UpdateTodoUseCase(): UpdateTodoUseCase {
          return getUpdateTodoUseCase();
        },
        get IUpdateTodoInputPort(): UpdateTodoUseCase {
          return getUpdateTodoUseCase();
        },
        get GetTodoUseCase(): GetTodoUseCase {
          return getGetTodoUseCase();
        },
        get IGetTodoInputPort(): GetTodoUseCase {
          return getGetTodoUseCase();
        },
        get DeleteTodoUseCase(): DeleteTodoUseCase {
          return getDeleteTodoUseCase();
        },
        get IDeleteTodoInputPort(): DeleteTodoUseCase {
          return getDeleteTodoUseCase();
        },
        get CreateTodoUseCase(): CreateTodoUseCase {
          return getCreateTodoUseCase();
        },
        get ICreateTodoInputPort(): CreateTodoUseCase {
          return getCreateTodoUseCase();
        },
        get TodoRepository(): TodoRepository {
          return getTodoRepository();
        },
        get ITodoRepository(): TodoRepository {
          return getTodoRepository();
        },
        get UpdateTodoPresenter(): UpdateTodoPresenter {
          return updateTodoPresenterFactory();
        },
        get IUpdateTodoOutputPort(): UpdateTodoPresenter {
          return updateTodoPresenterFactory();
        },
        get GetTodoPresenter(): GetTodoPresenter {
          return getTodoPresenterFactory();
        },
        get IGetTodoOutputPort(): GetTodoPresenter {
          return getTodoPresenterFactory();
        },
        get DeleteTodoPresenter(): DeleteTodoPresenter {
          return deleteTodoPresenterFactory();
        },
        get IDeleteTodoOutputPort(): DeleteTodoPresenter {
          return deleteTodoPresenterFactory();
        },
        get CreateTodoPresenter(): CreateTodoPresenter {
          return createTodoPresenterFactory();
        },
        get ICreateTodoOutputPort(): CreateTodoPresenter {
          return createTodoPresenterFactory();
        }
  };
}

const userModuleContainer = createUserModuleContainer();
const todoModuleContainer = createTodoModuleContainer(userModuleContainer);

export const container = {
  userModule: userModuleContainer,  todoModule: todoModuleContainer
};

export type Container = typeof container;
