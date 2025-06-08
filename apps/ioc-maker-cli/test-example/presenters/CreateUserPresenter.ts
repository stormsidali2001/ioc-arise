import { ICreateUserOutputPort } from '../IOutputPort';
import { User } from '../entities/User';

export class CreateUserPresenter implements ICreateUserOutputPort {
  private result: {
    success: boolean;
    user?: User;
    error?: string;
  } | null = null;

  presentSuccess(user: User): void {
    this.result = {
      success: true,
      user
    };
    console.log('User created successfully:', user);
  }

  presentError(error: string): void {
    this.result = {
      success: false,
      error
    };
    console.error('Error creating user:', error);
  }

  getResult() {
    return this.result;
  }

  clearResult(): void {
    this.result = null;
  }
}