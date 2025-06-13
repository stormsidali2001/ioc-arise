import { TodoService } from './todo/TodoService';
import { TodoRepository } from './todo/TodoRepository';
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

function createTodoModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {

  let todoService: TodoService | undefined;
  let todoRepository: TodoRepository | undefined;

  const getTodoService = (): TodoService => {
    if (!todoService) {
      todoService = new TodoService(getTodoRepository(), userModuleContainer.IUserRepository);
    }
    return todoService;
  };
  const getTodoRepository = (): TodoRepository => {
    if (!todoRepository) {
      todoRepository = new TodoRepository();
    }
    return todoRepository;
  };

  return {
        get TodoService(): TodoService {
          return getTodoService();
        },
        get ITodoService(): TodoService {
          return getTodoService();
        },
        get TodoRepository(): TodoRepository {
          return getTodoRepository();
        },
        get ITodoRepository(): TodoRepository {
          return getTodoRepository();
        }
  };
}

const userModuleContainer = createUserModuleContainer();
const todoModuleContainer = createTodoModuleContainer(userModuleContainer);

export const container = {
  userModule: userModuleContainer,  todoModule: todoModuleContainer
};

export type Container = typeof container;
