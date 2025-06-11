import { TodoService } from './services/TodoService';
import { InMemoryTodoRepository } from './repositories/InMemoryTodoRepository';

// Lazy initialization variables for singletons
let todoService: TodoService | undefined;
let inMemoryTodoRepository: InMemoryTodoRepository | undefined;

// Lazy getter functions for singletons
const getInMemoryTodoRepository = (): InMemoryTodoRepository => {
  if (!inMemoryTodoRepository) {
    inMemoryTodoRepository = new InMemoryTodoRepository();
  }
  return inMemoryTodoRepository;
};
const getTodoService = (): TodoService => {
  if (!todoService) {
    todoService = new TodoService(getInMemoryTodoRepository());
  }
  return todoService;
};

export const container = {
  get ITodoService(): TodoService {
    return getTodoService();
  },
  get ITodoRepository(): InMemoryTodoRepository {
    return getInMemoryTodoRepository();
  },
};

export type Container = typeof container;
