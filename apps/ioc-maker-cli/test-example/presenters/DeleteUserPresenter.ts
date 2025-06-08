import { IDeleteUserOutputPort } from '../IOutputPort';

export class DeleteUserPresenter implements IDeleteUserOutputPort {
  private result: {
    success: boolean;
    notFound?: boolean;
    error?: string;
  } | null = null;

  presentSuccess(): void {
    this.result = {
      success: true
    };
    console.log('User deleted successfully');
  }

  presentNotFound(): void {
    this.result = {
      success: false,
      notFound: true
    };
    console.log('User not found for deletion');
  }

  presentError(error: string): void {
    this.result = {
      success: false,
      error
    };
    console.error('Error deleting user:', error);
  }

  getResult() {
    return this.result;
  }

  clearResult(): void {
    this.result = null;
  }
}