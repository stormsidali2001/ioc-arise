import { IDeleteUserInputPort } from '../IInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { DeleteUserRequestDTO } from '../dtos/UserDTOs';
import { IDeleteUserOutputPort } from '../IOutputPort';

export class DeleteUserUseCase implements IDeleteUserInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: IDeleteUserOutputPort
  ) {}

  async execute(request: DeleteUserRequestDTO): Promise<void> {
    try {
      const user = await this.userRepository.findById(request.id);
      
      if (!user) {
        this.outputPort.presentNotFound();
        return;
      }

      await this.userRepository.delete(request.id);
      this.outputPort.presentSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}