import { IUserRepository } from '../repositories/IUserRepository';
import { ITodoRepository } from '../repositories/ITodoRepository';

/**
 * Factory function that returns a use case function
 * @scope singleton
 */
export function createTodoUseCase(
    userRepo: IUserRepository,
    todoRepo: ITodoRepository
) {
    return (userId: string, title: string): void => {
        const user = userRepo.getUser(userId);
        console.log(`Creating todo for ${user}`);
        todoRepo.saveTodo(title);
    };
}

