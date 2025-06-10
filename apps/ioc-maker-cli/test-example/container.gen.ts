import { UpdateTodoUseCase } from './use-cases/UpdateTodoUseCase';
import { GetTodoUseCase } from './use-cases/GetTodoUseCase';
import { DeleteTodoUseCase } from './use-cases/DeleteTodoUseCase';
import { CreateTodoUseCase } from './use-cases/CreateTodoUseCase';
import { UpdateTodoPresenter } from './presenters/UpdateTodoPresenter';
import { GetTodoPresenter } from './presenters/GetTodoPresenter';
import { DeleteTodoPresenter } from './presenters/DeleteTodoPresenter';
import { CreateTodoPresenter } from './presenters/CreateTodoPresenter';
import { TodoRepository } from './repositories/TodoRepository';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { GetTodosByUserUseCase } from './use-cases/GetTodosByUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { GetUserPresenter } from './presenters/GetUserPresenter';
import { GetTodosByUserPresenter } from './presenters/GetTodosByUserPresenter';
import { DeleteUserPresenter } from './presenters/DeleteUserPresenter';
import { CreateUserPresenter } from './presenters/CreateUserPresenter';
import { UserRepository } from './repositories/UserRepository';

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
const userRepository = new UserRepository();
const todoRepository = new TodoRepository();
const updateTodoUseCase = new UpdateTodoUseCase(userRepository, todoRepository, updateTodoPresenterFactory());
const getTodoUseCase = new GetTodoUseCase(userRepository, todoRepository, getTodoPresenterFactory());
const deleteTodoUseCase = new DeleteTodoUseCase(userRepository, todoRepository, deleteTodoPresenterFactory());
const createTodoUseCase = new CreateTodoUseCase(userRepository, createTodoPresenterFactory());
const getUserUseCase = new GetUserUseCase(userRepository, getUserPresenterFactory());
const getTodosByUserUseCase = new GetTodosByUserUseCase(userRepository, getTodosByUserPresenterFactory());
const deleteUserUseCase = new DeleteUserUseCase(userRepository, deleteUserPresenterFactory());
const createUserUseCase = new CreateUserUseCase(userRepository, createUserPresenterFactory());

const todoModuleContainer = {
  IUpdateTodoInputPort: updateTodoUseCase,
  IGetTodoInputPort: getTodoUseCase,
  IDeleteTodoInputPort: deleteTodoUseCase,
  ICreateTodoInputPort: createTodoUseCase,
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
  },
  ITodoRepository: todoRepository
};

const userModuleContainer = {
  IGetUserInputPort: getUserUseCase,
  IGetTodosByUserInputPort: getTodosByUserUseCase,
  IDeleteUserInputPort: deleteUserUseCase,
  ICreateUserInputPort: createUserUseCase,
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
  },
  IUserRepository: userRepository
};

export const container = {
  todoModule: todoModuleContainer,
  userModule: userModuleContainer
};

export type Container = typeof container;
