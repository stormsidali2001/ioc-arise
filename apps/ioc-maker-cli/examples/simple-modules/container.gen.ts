import { TodoService } from './todo/TodoService';
import { TodoRepository } from './todo/TodoRepository';
import { UserService } from './user/UserService';
import { UserRepository } from './user/UserRepository';

function createUserModuleContainer() {

  let userRepository: UserRepository | undefined;
  let userService: UserService | undefined;

  const getUserRepository = (): UserRepository => {
    if (!userRepository) {
      userRepository = new UserRepository();
    }
    return userRepository;
  };
  const getUserService = (): UserService => {
    if (!userService) {
      userService = new UserService(getUserRepository());
    }
    return userService;
  };

  return {
    get IUserService(): UserService {
      return getUserService();
    },
    get IUserRepository(): UserRepository {
      return getUserRepository();
    }
  };
}

function createTodoModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {

  let todoRepository: TodoRepository | undefined;
  let todoService: TodoService | undefined;

  const getTodoRepository = (): TodoRepository => {
    if (!todoRepository) {
      todoRepository = new TodoRepository();
    }
    return todoRepository;
  };
  const getTodoService = (): TodoService => {
    if (!todoService) {
      todoService = new TodoService(getTodoRepository(), userModuleContainer.IUserRepository);
    }
    return todoService;
  };

  return {
    get ITodoService(): TodoService {
      return getTodoService();
    },
    get ITodoRepository(): TodoRepository {
      return getTodoRepository();
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
