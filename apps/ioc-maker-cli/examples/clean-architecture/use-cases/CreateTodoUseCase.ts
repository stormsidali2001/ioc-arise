import { ICreateTodoInputPort } from '../ports/ITodoInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { CreateTodoData } from '../entities/Todo';
import { CreateTodoRequestDTO, TodoResponseDTO } from '../dtos/TodoDTOs';
import { ICreateTodoOutputPort } from '../ports/ITodoOutputPort';

export class CreateTodoUseCase implements ICreateTodoInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: ICreateTodoOutputPort
  ) {}

  async execute(todoData: CreateTodoRequestDTO): Promise<void> {
    try {
      // Validate input
      if (!todoData.title.trim()) {
        this.outputPort.presentError('Todo title is required');
        return;
      }

      if (!todoData.userId.trim()) {
        this.outputPort.presentError('User ID is required');
        return;
      }

      // Get the user aggregate
      const user = await this.userRepository.findById(todoData.userId);
      if (!user) {
        this.outputPort.presentError('User not found');
        return;
      }

      // Create todo through the user aggregate
      const createData: CreateTodoData = {
        title: todoData.title.trim(),
        description: todoData.description.trim(),
        userId: todoData.userId
      };
      
      const todo = user.addTodo(createData);

      // Save the user aggregate (which includes the new todo)
      await this.userRepository.save(user);
      
      // Convert entity to DTO for presentation
      const todoDTO: TodoResponseDTO = {
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        userId: todo.userId,
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString()
      };
      
      this.outputPort.presentSuccess(todoDTO);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}