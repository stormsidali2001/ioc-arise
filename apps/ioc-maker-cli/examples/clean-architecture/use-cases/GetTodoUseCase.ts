import { IGetTodoInputPort } from '../ports/ITodoInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { GetTodoRequestDTO, TodoResponseDTO } from '../dtos/TodoDTOs';
import { IGetTodoOutputPort } from '../ports/ITodoOutputPort';

export class GetTodoUseCase implements IGetTodoInputPort {
  constructor(
    private userRepository: IUserRepository,
    private todoRepository: ITodoRepository,
    private outputPort: IGetTodoOutputPort
  ) {}

  async execute(request: GetTodoRequestDTO): Promise<void> {
    try {
      // Directly fetch the todo by ID
      const foundTodo = await this.todoRepository.findById(request.id);
      
      if (foundTodo) {
        // Convert entity to DTO for presentation
        const todoDTO: TodoResponseDTO = {
          id: foundTodo.id,
          title: foundTodo.title,
          description: foundTodo.description,
          completed: foundTodo.completed,
          userId: foundTodo.userId,
          createdAt: foundTodo.createdAt.toISOString(),
          updatedAt: foundTodo.updatedAt.toISOString()
        };
        this.outputPort.presentTodo(todoDTO);
      } else {
        this.outputPort.presentNotFound();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}