import { IGetTodosByUserInputPort } from '../ports/ITodoInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { GetTodosByUserRequestDTO, TodoResponseDTO } from '../dtos/TodoDTOs';
import { IGetTodosByUserOutputPort } from '../ports/ITodoOutputPort';

export class GetTodosByUserUseCase implements IGetTodosByUserInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: IGetTodosByUserOutputPort
  ) {}

  async execute(request: GetTodosByUserRequestDTO): Promise<void> {
    try {
      const user = await this.userRepository.findById(request.userId);
      
      if (!user) {
        this.outputPort.presentTodos([]);
        return;
      }
      
      const todos = user.todos;
      
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