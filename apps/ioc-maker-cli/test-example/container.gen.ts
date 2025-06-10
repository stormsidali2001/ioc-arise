import { UpdateTodoUseCase } from './use-cases/UpdateTodoUseCase';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { GetTodosByUserUseCase } from './use-cases/GetTodosByUserUseCase';
import { GetTodoUseCase } from './use-cases/GetTodoUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { DeleteTodoUseCase } from './use-cases/DeleteTodoUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { CreateTodoUseCase } from './use-cases/CreateTodoUseCase';
import { UserRepository } from './repositories/UserRepository';
import { TodoRepository } from './repositories/TodoRepository';
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

// Eager singleton instantiation
const todoRepository = new TodoRepository();
const userRepository = new UserRepository();
const createTodoUseCase = new CreateTodoUseCase(userRepository, createTodoPresenterFactory());
const createUserUseCase = new CreateUserUseCase(userRepository, createUserPresenterFactory());
const deleteTodoUseCase = new DeleteTodoUseCase(userRepository, todoRepository, deleteTodoPresenterFactory());
const deleteUserUseCase = new DeleteUserUseCase(userRepository, deleteUserPresenterFactory());
const getTodoUseCase = new GetTodoUseCase(userRepository, todoRepository, getTodoPresenterFactory());
const getTodosByUserUseCase = new GetTodosByUserUseCase(userRepository, getTodosByUserPresenterFactory());
const getUserUseCase = new GetUserUseCase(userRepository, getUserPresenterFactory());
const updateTodoUseCase = new UpdateTodoUseCase(userRepository, todoRepository, updateTodoPresenterFactory());

export const container = {
  IUpdateTodoInputPort: updateTodoUseCase,
  IGetUserInputPort: getUserUseCase,
  IGetTodosByUserInputPort: getTodosByUserUseCase,
  IGetTodoInputPort: getTodoUseCase,
  IDeleteUserInputPort: deleteUserUseCase,
  IDeleteTodoInputPort: deleteTodoUseCase,
  ICreateUserInputPort: createUserUseCase,
  ICreateTodoInputPort: createTodoUseCase,
  IUserRepository: userRepository,
  ITodoRepository: todoRepository,
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
