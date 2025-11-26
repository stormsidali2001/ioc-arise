import { IApplicationService } from './IApplicationService';
import { UserController } from '../use-cases/UserController';

export class ApplicationService implements IApplicationService {
  constructor(private userController: UserController) {}

  async runUserOperations(): Promise<void> {
    console.log('=== Running User Operations Demo ===');
    
    // Create a new user
    await this.userController.createUser('Alice Johnson', 'alice@example.com');
    
    // Get existing users
    await this.userController.getUser('1'); // Should find John Doe
    await this.userController.getUser('999'); // Should not find
    
    console.log('=== Demo Complete ===');
  }
}