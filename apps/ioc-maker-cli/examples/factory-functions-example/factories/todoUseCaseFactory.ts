import { IUserRepository } from '../repositories/IUserRepository';
import { ITodoRepository } from '../repositories/ITodoRepository';

/**
 * Factory function using context object pattern
 * @scope singleton
 */
export function createTodoUseCase(
    context: { userRepo: IUserRepository, todoRepo: ITodoRepository }
) {
    return (userId: string, title: string): void => {
        const user = context.userRepo.getUser(userId);
        console.log(`Creating todo for ${user}`);
        context.todoRepo.saveTodo(title);
    };
}

