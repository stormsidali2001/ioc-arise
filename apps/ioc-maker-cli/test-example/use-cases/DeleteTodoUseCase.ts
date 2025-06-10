import { IDeleteTodoInputPort } from '../ITodoInputPort';
import { ITodoRepository } from '../repositories/ITodoRepository';
import { DeleteTodoRequestDTO } from '../dtos/TodoDTOs';
import { IDeleteTodoOutputPort } from '../ITodoOutputPort';

export class DeleteTodoUseCase implements IDeleteTodoInputPort {
  constructor(
    private todoRepository: ITodoRepository,
    private outputPort: IDeleteTodoOutputPort
  ) {}

  async execute(request: DeleteTodoRequestDTO): Promise<void> {
    try {
      const todo = await this.todoRepository.findById(request.id);
      
      if (!todo) {
        this.outputPort.presentNotFound();
        return;
      }

      await this.todoRepository.delete(request.id);
      this.outputPort.presentSuccess();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.outputPort.presentError(errorMessage);
    }
  }
}