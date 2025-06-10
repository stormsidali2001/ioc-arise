import { TodoResponseDTO } from '../dtos/TodoDTOs';
import { IUpdateTodoOutputPort } from '../ports/ITodoOutputPort';
import { UpdateTodoViewModel } from '../view-models/TodoViewModels';

/**
 * @scope transient
 */
export class UpdateTodoPresenter implements IUpdateTodoOutputPort {
  private viewModel: UpdateTodoViewModel = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    isNotFound: false,
    errorMessage: '',
    successMessage: '',
    todo: null
  };

  // Getter for ViewModel (for UI consumption)
  getViewModel(): UpdateTodoViewModel {
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
    this.viewModel.successMessage = '';
    this.viewModel.todo = null;
  }

  // Output port implementations
  presentSuccess(todo: TodoResponseDTO): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = true;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = false;
    this.viewModel.successMessage = `Todo '${todo.title}' updated successfully`;
    this.viewModel.todo = {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      userId: todo.userId
    };
    
    // Console output for demo purposes
    console.log('Todo updated successfully:', todo);
  }

  presentNotFound(): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = true;
    this.viewModel.todo = null;
    
    // Console output for demo purposes
    console.log('Todo not found for update');
  }

  presentError(error: string): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = true;
    this.viewModel.isNotFound = false;
    this.viewModel.errorMessage = error;
    this.viewModel.todo = null;
    
    // Console output for demo purposes
    console.error('Error updating todo:', error);
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