import { IGetTodoInputPort } from '../ITodoInputPort';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { GetTodoRequestDTO, TodoResponseDTO } from '../dtos/TodoDTOs';
import { IGetTodoOutputPort } from '../ITodoOutputPort';

export class GetTodoUseCase implements IGetTodoInputPort {
  constructor(
    private todoRepository: ITodoRepository,
    private outputPort: IGetTodoOutputPort
  ) {}

  async execute(request: GetTodoRequestDTO): Promise<void> {
    try {
      const todo = await this.todoRepository.findById(request.id);
      
      if (todo) {
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