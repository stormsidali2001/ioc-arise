import { UserResponseDTO } from '../dtos/UserDTOs';
import { ICreateUserOutputPort } from '../IOutputPort';
import { CreateUserViewModel } from '../view-models/UserViewModels';

export class CreateUserPresenter implements ICreateUserOutputPort {
  private viewModel: CreateUserViewModel = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    errorMessage: '',
    successMessage: '',
    user: null
  };

  // Getter for ViewModel (for UI consumption)
  getViewModel(): CreateUserViewModel {
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
    this.viewModel.user = null;
  }

  // Output port implementations
  presentSuccess(user: UserResponseDTO): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = true;
    this.viewModel.isError = false;
    this.viewModel.successMessage = `User '${user.name}' created successfully`;
    this.viewModel.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    
    // Console output for demo purposes
    console.log('User created successfully:', user);
  }

  presentError(error: string): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = true;
    this.viewModel.errorMessage = error;
    this.viewModel.user = null;
    
    // Console output for demo purposes
    console.error('Error creating user:', error);
  }

  // Legacy methods for backward compatibility
  getResult() {
    return {
      success: this.viewModel.isSuccess,
      user: this.viewModel.user,
      error: this.viewModel.errorMessage || undefined
    };
  }

  clearResult(): void {
    this.resetState();
  }
}