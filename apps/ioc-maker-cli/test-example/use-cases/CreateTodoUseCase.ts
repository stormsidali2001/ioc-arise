import { ICreateTodoInputPort } from '../ITodoInputPort';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { Todo } from '../entities/Todo';
import { CreateTodoRequestDTO, TodoResponseDTO } from '../dtos/TodoDTOs';
import { ICreateTodoOutputPort } from '../ITodoOutputPort';

export class CreateTodoUseCase implements ICreateTodoInputPort {
  constructor(
    private todoRepository: ITodoRepository,
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

      // Create new todo entity
      const todo: Todo = {
        id: Math.random().toString(36).substr(2, 9),
        title: todoData.title.trim(),
        description: todoData.description.trim(),
        completed: false,
        userId: todoData.userId,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await this.todoRepository.save(todo);
      
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