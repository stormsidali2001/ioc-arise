import { TodoService } from './todo/TodoService';
import { TodoRepository } from './todo/TodoRepository';
import { createUserModuleContainer } from './UserModule.gen';
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
        get ITodoService(): TodoService {
          return getTodoService();
        },
        get ITodoRepository(): TodoRepository {
          return getTodoRepository();
        }
  };
}
export { createTodoModuleContainer };
export type TodoModuleContainer = ReturnType<typeof createTodoModuleContainer>;