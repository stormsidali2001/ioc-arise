import { IGetTodosByUserInputPort } from '../ITodoInputPort';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { GetTodosByUserRequestDTO, TodoResponseDTO } from '../dtos/TodoDTOs';
import { IGetTodosByUserOutputPort } from '../ITodoOutputPort';

export class GetTodosByUserUseCase implements IGetTodosByUserInputPort {
  constructor(
    private todoRepository: ITodoRepository,
    private outputPort: IGetTodosByUserOutputPort
  ) {}

  async execute(request: GetTodosByUserRequestDTO): Promise<void> {
    try {
      const todos = await this.todoRepository.findByUserId(request.userId);
      
      // Convert entities to DTOs for presentation
      const todoDTOs: TodoResponseDTO[] = todos.map(todo => ({
        id: todo.id,
        title: todo.title,
        description: todo.description,
        completed: todo.completed,
        userId: todo.userId,
        createdAt: todo.createdAt.toISOString(),
        updatedAt: todo.updatedAt.toISOString()
      }));
      
      this.outputPort.presentTodos(todoDTOs);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}