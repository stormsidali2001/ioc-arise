import { IGetUserOutputPort } from '../IOutputPort';
import { User } from '../entities/User';

export class GetUserPresenter implements IGetUserOutputPort {
  private result: {
    success: boolean;
    user?: User;
    notFound?: boolean;
    error?: string;
  } | null = null;

  presentUser(user: User): void {
    this.result = {
      success: true,
      user
    };
    console.log('User found:', user);
  }

  presentNotFound(): void {
    this.result = {
      success: false,
      notFound: true
    };
    console.log('User not found');
  }

  presentError(error: string): void {
    this.result = {
      success: false,
      error
    };
    console.error('Error getting user:', error);
  }

  getResult() {
    return this.result;
  }

  clearResult(): void {
    this.result = null;
  }
}