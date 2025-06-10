import { IUpdateTodoInputPort } from '../ports/ITodoInputPort';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { UpdateTodoRequestDTO, TodoResponseDTO } from '../dtos/TodoDTOs';
import { IUpdateTodoOutputPort } from '../ports/ITodoOutputPort';

export class UpdateTodoUseCase implements IUpdateTodoInputPort {
  constructor(
    private todoRepository: ITodoRepository,
    private outputPort: IUpdateTodoOutputPort
  ) {}

  async execute(request: UpdateTodoRequestDTO): Promise<void> {
    try {
      const existingTodo = await this.todoRepository.findById(request.id);
      
      if (!existingTodo) {
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

      await this.todoRepository.update(request.id, updateData);
      
      // Get the updated todo
      const updatedTodo = await this.todoRepository.findById(request.id);
      
      if (updatedTodo) {
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
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}