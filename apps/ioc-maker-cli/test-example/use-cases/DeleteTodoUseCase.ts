import { IDeleteTodoInputPort } from '../ports/ITodoInputPort';
import { IUserRepository } from '../repositories/IUserRepository';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { DeleteTodoRequestDTO } from '../dtos/TodoDTOs';
import { IDeleteTodoOutputPort } from '../ports/ITodoOutputPort';

export class DeleteTodoUseCase implements IDeleteTodoInputPort {
  constructor(
    private userRepository: IUserRepository,
    private todoRepository: ITodoRepository,
    private outputPort: IDeleteTodoOutputPort
  ) {}

  async execute(request: DeleteTodoRequestDTO): Promise<void> {
    try {
      // First, find the todo to get its owner's userId
      const todo = await this.todoRepository.findById(request.id);
      
      if (!todo) {
        this.outputPort.presentNotFound();
        return;
      }
      
      // Now fetch only the specific user who owns this todo
      const ownerUser = await this.userRepository.findById(todo.userId);
      
      if (!ownerUser) {
        this.outputPort.presentNotFound();
        return;
      }

      // Remove todo through the user aggregate
      const wasRemoved = ownerUser.removeTodo(request.id);
      
      if (!wasRemoved) {
        this.outputPort.presentNotFound();
        return;
      }
      
      // Save the user aggregate
      await this.userRepository.save(ownerUser);
      
      this.outputPort.presentSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}