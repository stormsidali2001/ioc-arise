import { IUpdateTodoInputPort } from '../ports/ITodoInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { UpdateTodoRequestDTO, TodoResponseDTO } from '../dtos/TodoDTOs';
import { IUpdateTodoOutputPort } from '../ports/ITodoOutputPort';

export class UpdateTodoUseCase implements IUpdateTodoInputPort {
  constructor(
    private userRepository: IUserRepository,
    private todoRepository: ITodoRepository,
    private outputPort: IUpdateTodoOutputPort
  ) {}

  async execute(request: UpdateTodoRequestDTO): Promise<void> {
    try {
      // First, find the todo to get its owner's userId
      const existingTodo = await this.todoRepository.findById(request.id);
      
      if (!existingTodo) {
        this.outputPort.presentNotFound();
        return;
      }
      
      // Now fetch only the specific user who owns this todo
      const ownerUser = await this.userRepository.findById(existingTodo.userId);
      
      if (!ownerUser) {
        this.outputPort.presentNotFound();
        return;
      }

      // Validate input if title is being updated
      if (request.title !== undefined && !request.title.trim()) {
        this.outputPort.presentError('Todo title cannot be empty');
        return;
      }

      // Prepare update data
      const updateData = {
        ...(request.title !== undefined && { title: request.title.trim() }),
        ...(request.description !== undefined && { description: request.description.trim() }),
        ...(request.completed !== undefined && { completed: request.completed })
      };

      // Update todo through the user aggregate
      const updatedTodo = ownerUser.updateTodo(request.id, updateData);
      
      // Save the user aggregate
      await this.userRepository.save(ownerUser);
      
      // Convert entity to DTO for presentation
      const todoDTO: TodoResponseDTO = {
        id: updatedTodo.id,
        title: updatedTodo.title,
        description: updatedTodo.description,
        completed: updatedTodo.completed,
        userId: updatedTodo.userId,
        createdAt: updatedTodo.createdAt.toISOString(),
        updatedAt: updatedTodo.updatedAt.toISOString()
      };
      
      this.outputPort.presentSuccess(todoDTO);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}