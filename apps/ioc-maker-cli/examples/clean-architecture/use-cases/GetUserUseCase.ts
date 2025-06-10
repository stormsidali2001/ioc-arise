import { IGetUserInputPort } from '../ports/IInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../entities/User';
import { GetUserRequestDTO, UserResponseDTO } from '../dtos/UserDTOs';
import { IGetUserOutputPort } from '../ports/IOutputPort';

export class GetUserUseCase implements IGetUserInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: IGetUserOutputPort
  ) {}

  async execute(request: GetUserRequestDTO): Promise<void> {
    try {
      const user = await this.userRepository.findById(request.id);
      
      if (user) {
        // Convert entity to DTO for presentation
        const userDTO: UserResponseDTO = {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString()
        };
        this.outputPort.presentUser(userDTO);
      } else {
        this.outputPort.presentNotFound();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}