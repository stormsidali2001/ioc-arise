import { IUserRepository } from '../../user/IUserRepository';
import { ITodoRepository } from '../ITodoRepository';

/**
 * Factory that produces an "add todo" use-case function.
 * Uses the context object pattern so both repos are injected together.
 * @factory
 * @scope singleton
 */
export function createAddTodoUseCase(context: {
  userRepo: IUserRepository;
  todoRepo: ITodoRepository;
}) {
  return function addTodo(userId: string, title: string): void {
    const name = context.userRepo.findById(userId);
    if (!name) throw new Error(`User ${userId} not found`);
    context.todoRepo.add(userId, title);
    console.log(`Added todo "${title}" for ${name}`);
  };
}
