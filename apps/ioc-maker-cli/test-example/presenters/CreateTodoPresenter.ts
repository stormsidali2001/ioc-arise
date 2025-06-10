import { TodoResponseDTO } from '../dtos/TodoDTOs';
import { ICreateTodoOutputPort } from '../ports/ITodoOutputPort';
import { CreateTodoViewModel } from '../view-models/TodoViewModels';

/**
 * @scope transient
 */
export class CreateTodoPresenter implements ICreateTodoOutputPort {
  private viewModel: CreateTodoViewModel = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    errorMessage: '',
    successMessage: '',
    todo: null
  };

  // Getter for ViewModel (for UI consumption)
  getViewModel(): CreateTodoViewModel {
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
    this.viewModel.errorMessage = '';
    this.viewModel.successMessage = '';
    this.viewModel.todo = null;
  }

  // Output port implementations
  presentSuccess(todo: TodoResponseDTO): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = true;
    this.viewModel.isError = false;
    this.viewModel.successMessage = `Todo '${todo.title}' created successfully`;
    this.viewModel.todo = {
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      userId: todo.userId
    };
    
    // Console output for demo purposes
    console.log('Todo created successfully:', todo);
  }

  presentError(error: string): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = true;
    this.viewModel.errorMessage = error;
    this.viewModel.todo = null;
    
    // Console output for demo purposes
    console.error('Error creating todo:', error);
  }

  // Legacy methods for backward compatibility
  getResult() {
    return {
      success: this.viewModel.isSuccess,
      todo: this.viewModel.todo,
      error: this.viewModel.errorMessage || undefined
    };
  }

  clearResult(): void {
    this.resetState();
  }
}