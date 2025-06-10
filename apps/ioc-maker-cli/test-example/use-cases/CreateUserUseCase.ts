import { ICreateUserInputPort } from '../ports/IInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { User } from '../entities/User';
import { CreateUserRequestDTO, UserResponseDTO } from '../dtos/UserDTOs';
import { ICreateUserOutputPort as OutputPort  } from '../ports/IOutputPort';

export class CreateUserUseCase implements ICreateUserInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: OutputPort
  ) {}

  async execute(userData: CreateUserRequestDTO): Promise<void> {
    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser) {
        this.outputPort.presentError('User with this email already exists');
        return;
      }

      // Create new user entity
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        email: userData.email,
        name: userData.name,
        createdAt: new Date()
      };

      await this.userRepository.save(user);
      
      // Convert entity to DTO for presentation
      const userDTO: UserResponseDTO = {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString()
      };
      
      this.outputPort.presentSuccess(userDTO);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}