import { UserRepository } from './repositories/UserRepository';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { GetTodosByUserUseCase } from './use-cases/GetTodosByUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { GetUserPresenter } from './presenters/GetUserPresenter';
import { GetTodosByUserPresenter } from './presenters/GetTodosByUserPresenter';
import { DeleteUserPresenter } from './presenters/DeleteUserPresenter';
import { CreateUserPresenter } from './presenters/CreateUserPresenter';
import { TodoRepository } from './repositories/TodoRepository';
import { UpdateTodoUseCase } from './use-cases/UpdateTodoUseCase';
import { GetTodoUseCase } from './use-cases/GetTodoUseCase';
import { DeleteTodoUseCase } from './use-cases/DeleteTodoUseCase';
import { CreateTodoUseCase } from './use-cases/CreateTodoUseCase';
import { UpdateTodoPresenter } from './presenters/UpdateTodoPresenter';
import { GetTodoPresenter } from './presenters/GetTodoPresenter';
import { DeleteTodoPresenter } from './presenters/DeleteTodoPresenter';
import { CreateTodoPresenter } from './presenters/CreateTodoPresenter';

function createUserModuleContainer() {
  const getUserPresenterFactory = (): GetUserPresenter => new GetUserPresenter();
  const getTodosByUserPresenterFactory = (): GetTodosByUserPresenter => new GetTodosByUserPresenter();
  const deleteUserPresenterFactory = (): DeleteUserPresenter => new DeleteUserPresenter();
  const createUserPresenterFactory = (): CreateUserPresenter => new CreateUserPresenter();

  const userRepository = new UserRepository();
  const getUserUseCase = new GetUserUseCase(userRepository, getUserPresenterFactory());
  const getTodosByUserUseCase = new GetTodosByUserUseCase(userRepository, getTodosByUserPresenterFactory());
  const deleteUserUseCase = new DeleteUserUseCase(userRepository, deleteUserPresenterFactory());
  const createUserUseCase = new CreateUserUseCase(userRepository, createUserPresenterFactory());

  return {
    IUserRepository: userRepository,
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
    }
  };
}

function createTodoModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {
  const updateTodoPresenterFactory = (): UpdateTodoPresenter => new UpdateTodoPresenter();
  const getTodoPresenterFactory = (): GetTodoPresenter => new GetTodoPresenter();
  const deleteTodoPresenterFactory = (): DeleteTodoPresenter => new DeleteTodoPresenter();
  const createTodoPresenterFactory = (): CreateTodoPresenter => new CreateTodoPresenter();

  const todoRepository = new TodoRepository();
  const updateTodoUseCase = new UpdateTodoUseCase(userModuleContainer.IUserRepository, todoRepository, updateTodoPresenterFactory());
  const getTodoUseCase = new GetTodoUseCase(userModuleContainer.IUserRepository, todoRepository, getTodoPresenterFactory());
  const deleteTodoUseCase = new DeleteTodoUseCase(userModuleContainer.IUserRepository, todoRepository, deleteTodoPresenterFactory());
  const createTodoUseCase = new CreateTodoUseCase(userModuleContainer.IUserRepository, createTodoPresenterFactory());

  return {
    ITodoRepository: todoRepository,
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
    }
  };
}

const userModuleContainer = createUserModuleContainer();
const todoModuleContainer = createTodoModuleContainer(userModuleContainer);

export const container = {
  userModule: userModuleContainer,
  todoModule: todoModuleContainer
};

export type Container = typeof container;
