import { Todo } from './Todo';
import { ITodoService } from './ITodoService';
import { ITodoRepository } from './ITodoRepository';
import { IUserRepository } from '../user/IUserRepository';

/**
 * @scope singleton
 */
export class TodoService implements ITodoService {
  constructor(
    private todoRepository: ITodoRepository,
    private userRepository: IUserRepository
  ) {}

  async getTodo(id: string): Promise<Todo | null> {
    return this.todoRepository.findById(id);
  }

  async getTodosByUser(userId: string): Promise<Todo[]> {
    // Verify user exists before getting todos
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return this.todoRepository.findByUserId(userId);
  }

  async getAllTodos(): Promise<Todo[]> {
    return this.todoRepository.findAll();
  }

  async createTodo(title: string, userId: string): Promise<Todo> {
    // Verify user exists before creating todo
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return this.todoRepository.create(title, userId);
  }

  async updateTodo(id: string, title?: string, completed?: boolean): Promise<Todo | null> {
    return this.todoRepository.update(id, title, completed);
  }

  async deleteTodo(id: string): Promise<boolean> {
    return this.todoRepository.delete(id);
  }
}