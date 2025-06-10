import { IDeleteTodoOutputPort } from '../ports/ITodoOutputPort';
import { DeleteTodoViewModel } from '../view-models/TodoViewModels';

/**
 * @scope transient
 */
export class DeleteTodoPresenter implements IDeleteTodoOutputPort {
  private viewModel: DeleteTodoViewModel = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    isNotFound: false,
    errorMessage: '',
    successMessage: ''
  };

  // Getter for ViewModel (for UI consumption)
  getViewModel(): DeleteTodoViewModel {
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
  }

  // Output port implementations
  presentSuccess(): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = true;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = false;
    this.viewModel.successMessage = 'Todo deleted successfully';
    
    // Console output for demo purposes
    console.log('Todo deleted successfully');
  }

  presentNotFound(): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = true;
    
    // Console output for demo purposes
    console.log('Todo not found for deletion');
  }

  presentError(error: string): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = true;
    this.viewModel.isNotFound = false;
    this.viewModel.errorMessage = error;
    
    // Console output for demo purposes
    console.error('Error deleting todo:', error);
  }

  // Legacy methods for backward compatibility
  getResult() {
    return {
      success: this.viewModel.isSuccess,
      notFound: this.viewModel.isNotFound || undefined,
      error: this.viewModel.errorMessage || undefined
    };
  }

  clearResult(): void {
    this.resetState();
  }
}