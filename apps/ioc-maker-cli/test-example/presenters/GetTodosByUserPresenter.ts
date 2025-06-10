import { TodoResponseDTO } from '../dtos/TodoDTOs';
import { IGetTodosByUserOutputPort } from '../ITodoOutputPort';
import { GetTodosByUserViewModel } from '../view-models/TodoViewModels';

/**
 * @scope transient
 */
export class GetTodosByUserPresenter implements IGetTodosByUserOutputPort {
  private viewModel: GetTodosByUserViewModel = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    errorMessage: '',
    todos: []
  };

  // Getter for ViewModel (for UI consumption)
  getViewModel(): GetTodosByUserViewModel {
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
    this.viewModel.todos = [];
  }

  // Output port implementations
  presentTodos(todos: TodoResponseDTO[]): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = true;
    this.viewModel.isError = false;
    this.viewModel.todos = todos.map(todo => ({
      id: todo.id,
      title: todo.title,
      description: todo.description,
      completed: todo.completed,
      userId: todo.userId
    }));
    
    // Console output for demo purposes
    console.log(`Found ${todos.length} todos for user:`, todos);
  }

  presentError(error: string): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = true;
    this.viewModel.errorMessage = error;
    this.viewModel.todos = [];
    
    // Console output for demo purposes
    console.error('Error getting todos by user:', error);
  }

  // Legacy methods for backward compatibility
  getResult() {
    return {
      success: this.viewModel.isSuccess,
      todos: this.viewModel.todos,
      error: this.viewModel.errorMessage || undefined
    };
  }

  clearResult(): void {
    this.resetState();
  }
}