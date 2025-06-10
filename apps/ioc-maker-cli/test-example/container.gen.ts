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

// Lazy loading setup for transient dependencies
const updateTodoPresenterFactory = (): UpdateTodoPresenter => new UpdateTodoPresenter();
const getTodoPresenterFactory = (): GetTodoPresenter => new GetTodoPresenter();
const deleteTodoPresenterFactory = (): DeleteTodoPresenter => new DeleteTodoPresenter();
const createTodoPresenterFactory = (): CreateTodoPresenter => new CreateTodoPresenter();
const getUserPresenterFactory = (): GetUserPresenter => new GetUserPresenter();
const getTodosByUserPresenterFactory = (): GetTodosByUserPresenter => new GetTodosByUserPresenter();
const deleteUserPresenterFactory = (): DeleteUserPresenter => new DeleteUserPresenter();
const createUserPresenterFactory = (): CreateUserPresenter => new CreateUserPresenter();

// Eager singleton instantiation
// TodoModule module dependencies
const todoRepository = new TodoRepository();
const createTodoUseCase = new CreateTodoUseCase(todoRepository, createTodoPresenterFactory());
const deleteTodoUseCase = new DeleteTodoUseCase(todoRepository, deleteTodoPresenterFactory());
const getTodoUseCase = new GetTodoUseCase(todoRepository, getTodoPresenterFactory());
const updateTodoUseCase = new UpdateTodoUseCase(todoRepository, updateTodoPresenterFactory());
// UserModule module dependencies
const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository, createUserPresenterFactory());
const deleteUserUseCase = new DeleteUserUseCase(userRepository, deleteUserPresenterFactory());
const getTodosByUserUseCase = new GetTodosByUserUseCase(todoRepository, getTodosByUserPresenterFactory());
const getUserUseCase = new GetUserUseCase(userRepository, getUserPresenterFactory());

const todoModuleContainer = {
  IUpdateTodoInputPort: updateTodoUseCase,
  IGetTodoInputPort: getTodoUseCase,
  IDeleteTodoInputPort: deleteTodoUseCase,
  ICreateTodoInputPort: createTodoUseCase,
  ITodoRepository: todoRepository,
  get IUpdateTodoOutputPort(): UpdateTodoPresenter {
    return updateTodoPresenterFactory();
  },
  get IGetTodoOutputPort(): GetTodoPresenter {
    return getTodoPresenterFactory();
  },
  get IDeleteTodoOutputPort(): DeleteTodoPresenter {
    return deleteTodoPresenterFactory();
  },
  get ICreateTodoOutputPort(): CreateTodoPresenter {
    return createTodoPresenterFactory();
  }
};

const userModuleContainer = {
  IGetUserInputPort: getUserUseCase,
  IGetTodosByUserInputPort: getTodosByUserUseCase,
  IDeleteUserInputPort: deleteUserUseCase,
  ICreateUserInputPort: createUserUseCase,
  IUserRepository: userRepository,
  get IGetUserOutputPort(): GetUserPresenter {
    return getUserPresenterFactory();
  },
  get IGetTodosByUserOutputPort(): GetTodosByUserPresenter {
    return getTodosByUserPresenterFactory();
  },
  get IDeleteUserOutputPort(): DeleteUserPresenter {
    return deleteUserPresenterFactory();
  },
  get ICreateUserOutputPort(): CreateUserPresenter {
    return createUserPresenterFactory();
  }
};

export const container = {
  todoModule: todoModuleContainer,
  userModule: userModuleContainer
};

export type Container = typeof container;
