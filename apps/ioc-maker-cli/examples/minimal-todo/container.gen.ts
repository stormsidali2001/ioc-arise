import { TodoService } from './services/TodoService';
import { InMemoryTodoRepository } from './repositories/InMemoryTodoRepository';

function createCoreModuleContainer() {

  let todoService: TodoService | undefined;
  let inMemoryTodoRepository: InMemoryTodoRepository | undefined;

  const getTodoService = (): TodoService => {
    if (!todoService) {
      todoService = new TodoService(getInMemoryTodoRepository());
    }
    return todoService;
  };
  const getInMemoryTodoRepository = (): InMemoryTodoRepository => {
    if (!inMemoryTodoRepository) {
      inMemoryTodoRepository = new InMemoryTodoRepository();
    }
    return inMemoryTodoRepository;
  };

  return {
        get ITodoService(): TodoService {
          return getTodoService();
        },
        get ITodoRepository(): InMemoryTodoRepository {
          return getInMemoryTodoRepository();
        }
  };
}

const coreModuleContainer = createCoreModuleContainer();

export const container = {
  coreModule: coreModuleContainer
};

export type Container = typeof container;
