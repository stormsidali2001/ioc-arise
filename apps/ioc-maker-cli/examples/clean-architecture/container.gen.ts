import { UserRepository } from './repositories/UserRepository';
import { TodoRepository } from './repositories/TodoRepository';
import { UpdateTodoUseCase } from './use-cases/UpdateTodoUseCase';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { GetTodosByUserUseCase } from './use-cases/GetTodosByUserUseCase';
import { GetTodoUseCase } from './use-cases/GetTodoUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { DeleteTodoUseCase } from './use-cases/DeleteTodoUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { CreateTodoUseCase } from './use-cases/CreateTodoUseCase';
import { UpdateTodoPresenter } from './presenters/UpdateTodoPresenter';
import { GetUserPresenter } from './presenters/GetUserPresenter';
import { GetTodosByUserPresenter } from './presenters/GetTodosByUserPresenter';
import { GetTodoPresenter } from './presenters/GetTodoPresenter';
import { DeleteUserPresenter } from './presenters/DeleteUserPresenter';
import { DeleteTodoPresenter } from './presenters/DeleteTodoPresenter';
import { CreateUserPresenter } from './presenters/CreateUserPresenter';
import { CreateTodoPresenter } from './presenters/CreateTodoPresenter';

// Lazy loading setup for transient dependencies
const updateTodoPresenterFactory = (): UpdateTodoPresenter => new UpdateTodoPresenter();
const getUserPresenterFactory = (): GetUserPresenter => new GetUserPresenter();
const getTodosByUserPresenterFactory = (): GetTodosByUserPresenter => new GetTodosByUserPresenter();
const getTodoPresenterFactory = (): GetTodoPresenter => new GetTodoPresenter();
const deleteUserPresenterFactory = (): DeleteUserPresenter => new DeleteUserPresenter();
const deleteTodoPresenterFactory = (): DeleteTodoPresenter => new DeleteTodoPresenter();
const createUserPresenterFactory = (): CreateUserPresenter => new CreateUserPresenter();
const createTodoPresenterFactory = (): CreateTodoPresenter => new CreateTodoPresenter();

// Lazy initialization variables for singletons
let createTodoUseCase: CreateTodoUseCase | undefined;
let createUserUseCase: CreateUserUseCase | undefined;
let deleteTodoUseCase: DeleteTodoUseCase | undefined;
let deleteUserUseCase: DeleteUserUseCase | undefined;
let getTodoUseCase: GetTodoUseCase | undefined;
let getTodosByUserUseCase: GetTodosByUserUseCase | undefined;
let getUserUseCase: GetUserUseCase | undefined;
let updateTodoUseCase: UpdateTodoUseCase | undefined;
let todoRepository: TodoRepository | undefined;
let userRepository: UserRepository | undefined;

// Lazy getter functions for singletons
const getUserRepository = (): UserRepository => {
  if (!userRepository) {
    userRepository = new UserRepository();
  }
  return userRepository;
};
const getTodoRepository = (): TodoRepository => {
  if (!todoRepository) {
    todoRepository = new TodoRepository();
  }
  return todoRepository;
};
const getUpdateTodoUseCase = (): UpdateTodoUseCase => {
  if (!updateTodoUseCase) {
    updateTodoUseCase = new UpdateTodoUseCase(getUserRepository(), getTodoRepository(), updateTodoPresenterFactory());
  }
  return updateTodoUseCase;
};
const getGetUserUseCase = (): GetUserUseCase => {
  if (!getUserUseCase) {
    getUserUseCase = new GetUserUseCase(getUserRepository(), getUserPresenterFactory());
  }
  return getUserUseCase;
};
const getGetTodosByUserUseCase = (): GetTodosByUserUseCase => {
  if (!getTodosByUserUseCase) {
    getTodosByUserUseCase = new GetTodosByUserUseCase(getUserRepository(), getTodosByUserPresenterFactory());
  }
  return getTodosByUserUseCase;
};
const getGetTodoUseCase = (): GetTodoUseCase => {
  if (!getTodoUseCase) {
    getTodoUseCase = new GetTodoUseCase(getUserRepository(), getTodoRepository(), getTodoPresenterFactory());
  }
  return getTodoUseCase;
};
const getDeleteUserUseCase = (): DeleteUserUseCase => {
  if (!deleteUserUseCase) {
    deleteUserUseCase = new DeleteUserUseCase(getUserRepository(), deleteUserPresenterFactory());
  }
  return deleteUserUseCase;
};
const getDeleteTodoUseCase = (): DeleteTodoUseCase => {
  if (!deleteTodoUseCase) {
    deleteTodoUseCase = new DeleteTodoUseCase(getUserRepository(), getTodoRepository(), deleteTodoPresenterFactory());
  }
  return deleteTodoUseCase;
};
const getCreateUserUseCase = (): CreateUserUseCase => {
  if (!createUserUseCase) {
    createUserUseCase = new CreateUserUseCase(getUserRepository(), createUserPresenterFactory());
  }
  return createUserUseCase;
};
const getCreateTodoUseCase = (): CreateTodoUseCase => {
  if (!createTodoUseCase) {
    createTodoUseCase = new CreateTodoUseCase(getUserRepository(), createTodoPresenterFactory());
  }
  return createTodoUseCase;
};

export const container = {
  get IUserRepository(): UserRepository {
    return getUserRepository();
  },
  get ITodoRepository(): TodoRepository {
    return getTodoRepository();
  },
  get IUpdateTodoInputPort(): UpdateTodoUseCase {
    return getUpdateTodoUseCase();
  },
  get IGetUserInputPort(): GetUserUseCase {
    return getGetUserUseCase();
  },
  get IGetTodosByUserInputPort(): GetTodosByUserUseCase {
    return getGetTodosByUserUseCase();
  },
  get IGetTodoInputPort(): GetTodoUseCase {
    return getGetTodoUseCase();
  },
  get IDeleteUserInputPort(): DeleteUserUseCase {
    return getDeleteUserUseCase();
  },
  get IDeleteTodoInputPort(): DeleteTodoUseCase {
    return getDeleteTodoUseCase();
  },
  get ICreateUserInputPort(): CreateUserUseCase {
    return getCreateUserUseCase();
  },
  get ICreateTodoInputPort(): CreateTodoUseCase {
    return getCreateTodoUseCase();
  },
  get IUpdateTodoOutputPort(): UpdateTodoPresenter {
    return updateTodoPresenterFactory();
  },
  get IGetUserOutputPort(): GetUserPresenter {
    return getUserPresenterFactory();
  },
  get IGetTodosByUserOutputPort(): GetTodosByUserPresenter {
    return getTodosByUserPresenterFactory();
  },
  get IGetTodoOutputPort(): GetTodoPresenter {
    return getTodoPresenterFactory();
  },
  get IDeleteUserOutputPort(): DeleteUserPresenter {
    return deleteUserPresenterFactory();
  },
  get IDeleteTodoOutputPort(): DeleteTodoPresenter {
    return deleteTodoPresenterFactory();
  },
  get ICreateUserOutputPort(): CreateUserPresenter {
    return createUserPresenterFactory();
  },
  get ICreateTodoOutputPort(): CreateTodoPresenter {
    return createTodoPresenterFactory();
  },
};

export type Container = typeof container;
