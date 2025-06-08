import { IGetUserInputPort } from '../IInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../entities/User';
import { IGetUserOutputPort } from '../IOutputPort';

export class GetUserUseCase implements IGetUserInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: IGetUserOutputPort
  ) {}

  async execute(id: string): Promise<User | null> {
    try {
      const user = await this.userRepository.findById(id);
      
      if (user) {
        this.outputPort.presentUser(user);
        return user;
      } else {
        this.outputPort.presentNotFound();
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
      throw error;
    }
  }
}