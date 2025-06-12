import { CreateUserUseCase } from './CreateUserUseCase';
import { GetUserUseCase } from './GetUserUseCase';

// This controller uses use cases as dependencies
// It does NOT implement an interface but should be included because it's used as a dependency
export class UserController {
  constructor(
    private createUserUseCase: CreateUserUseCase,
    private getUserUseCase: GetUserUseCase
  ) {}

  async createUser(name: string, email: string): Promise<void> {
    console.log('UserController: Creating user...');
    await this.createUserUseCase.execute(name, email);
  }

  async getUser(userId: string): Promise<void> {
    console.log('UserController: Getting user...');
    await this.getUserUseCase.execute(userId);
  }
}