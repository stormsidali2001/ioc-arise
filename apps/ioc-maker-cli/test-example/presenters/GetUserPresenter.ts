import { UserResponseDTO } from '../dtos/UserDTOs';
import { IGetUserOutputPort } from '../ports/IOutputPort';
import { GetUserViewModel } from '../view-models/UserViewModels';

/**
 * @scope transient
 */
export class GetUserPresenter implements IGetUserOutputPort {
  private viewModel: GetUserViewModel = {
    isLoading: false,
    isSuccess: false,
    isError: false,
    isNotFound: false,
    errorMessage: '',
    user: null
  };

  // Getter for ViewModel (for UI consumption)
  getViewModel(): GetUserViewModel {
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
    this.viewModel.user = null;
  }

  // Output port implementations
  presentUser(user: UserResponseDTO): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = true;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = false;
    this.viewModel.user = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    
    // Console output for demo purposes
    console.log('User found:', user);
  }

  presentNotFound(): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = false;
    this.viewModel.isNotFound = true;
    this.viewModel.user = null;
    
    // Console output for demo purposes
    console.log('User not found');
  }

  presentError(error: string): void {
    this.viewModel.isLoading = false;
    this.viewModel.isSuccess = false;
    this.viewModel.isError = true;
    this.viewModel.isNotFound = false;
    this.viewModel.errorMessage = error;
    this.viewModel.user = null;
    
    // Console output for demo purposes
    console.error('Error getting user:', error);
  }

  // Legacy methods for backward compatibility
  getResult() {
    return {
      success: this.viewModel.isSuccess,
      user: this.viewModel.user,
      notFound: this.viewModel.isNotFound || undefined,
      error: this.viewModel.errorMessage || undefined
    };
  }

  clearResult(): void {
    this.resetState();
  }
}