import { IUserRepository } from '../repositories/IUserRepository';

/**
 * Factory function using separate parameters pattern
 * @scope singleton
 * @factory
 */
export function createUserUseCase(
    userRepo: IUserRepository
) {
    return (userId: string): string => {
        return userRepo.getUser(userId);
    };
}

