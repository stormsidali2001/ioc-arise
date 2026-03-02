import { IUserRepository } from '../IUserRepository';

/**
 * Factory that produces a "find user" use-case function.
 * @factory
 * @scope singleton
 */
export function createFindUserUseCase(userRepo: IUserRepository) {
  return function findUser(id: string): string {
    const name = userRepo.findById(id);
    if (!name) throw new Error(`User ${id} not found`);
    return name;
  };
}
