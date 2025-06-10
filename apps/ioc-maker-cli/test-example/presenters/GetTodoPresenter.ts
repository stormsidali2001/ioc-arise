import { TodoResponseDTO } from '../dtos/TodoDTOs';
import { IGetTodoOutputPort } from '../ITodoOutputPort';
import { GetTodoViewModel } from '../view-models/TodoViewModels';

/**
 * @scope transient
 */
export class GetTodoPresenter implements IGetTodoOutputPort {
  private viewModel: GetTodoViewModel = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    isNotFound: false,
    errorMessage: '',
    todo: null
  };

  // Getter for ViewModel (for UI consumption)
  getViewModel(): GetTodoViewModel {
    return { ...this.viewModel };
  }

  // View-related business logic methods
  setLoading(isLoading: boolean): void {
    this.viewModel.isLoading = isLoading;
    if (isLoading) {
      this.resetState();
    }
  }

  private resetState(): void {
    this.viewModel.isSuccess = false;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = false;
    this.viewModel.errorMessage = '';
    this.viewModel.todo = null;
  }

  // Output port implementations
  presentTodo(todo: TodoResponseDTO): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = true;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = false;
    this.viewModel.todo = {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      userId: todo.userId
    };
    
    // Console output for demo purposes
    console.log('Todo found:', todo);
  }

  presentNotFound(): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = true;
    this.viewModel.todo = null;
    
    // Console output for demo purposes
    console.log('Todo not found');
  }

  presentError(error: string): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = true;
    this.viewModel.isNotFound = false;
    this.viewModel.errorMessage = error;
    this.viewModel.todo = null;
    
    // Console output for demo purposes
    console.error('Error getting todo:', error);
  }

  // Legacy methods for backward compatibility
  getResult() {
    return {
      success: this.viewModel.isSuccess,
      todo: this.viewModel.todo,
      notFound: this.viewModel.isNotFound || undefined,
      error: this.viewModel.errorMessage || undefined
    };
  }

  clearResult(): void {
    this.resetState();
  }
}