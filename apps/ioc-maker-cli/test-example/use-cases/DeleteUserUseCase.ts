import { IDeleteUserInputPort } from '../IInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { IDeleteUserOutputPort } from '../IOutputPort';

export class DeleteUserUseCase implements IDeleteUserInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: IDeleteUserOutputPort
  ) {}

  async execute(id: string): Promise<void> {
    try {
      const user = await this.userRepository.findById(id);
      
      if (!user) {
        this.outputPort.presentNotFound();
        return;
      }

      await this.userRepository.delete(id);
      this.outputPort.presentSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
      throw error;
    }
  }
}