import { IUserRepository, IEmailService, IUserService, User, CreateUserData } from './interfaces';

export class Sidali{
  constructor(private age:number,private name:string){}

}
export class UserRepository implements IUserRepository {
  constructor(private sidali:Sidali) {}

  async findById(id: string): Promise<User | null> {
    // Mock implementation
    return { id, email: 'test@example.com', name: 'Test User' };
  }

  async save(user: User): Promise<void> {
    // Mock implementation
    console.log('Saving user:', user);
  }
}

export class EmailService implements IEmailService {
  constructor() {}

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    // Mock implementation
    console.log(`Sending email to ${to}: ${subject}`);
  }
}

export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService
  ) {}

  async createUser(userData: CreateUserData): Promise<User> {
    const user: User = {
      id: Math.random().toString(36),
      ...userData
    };
    
    await this.userRepository.save(user);
    await this.emailService.sendEmail(
      user.email,
      'Welcome!',
      `Welcome ${user.name}!`
    );
    
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findById(id);
  }
}