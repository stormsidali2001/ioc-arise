import { CreateItemUseCase } from './CreateItemUseCase';

export class UserController {
  constructor(private createItemUseCase: CreateItemUseCase) {}

  async createUserItem(name: string, description: string): Promise<void> {
    console.log('UserController: Creating user item...');
    await this.createItemUseCase.execute({ name, description });
  }
}