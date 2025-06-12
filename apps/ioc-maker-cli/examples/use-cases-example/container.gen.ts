import { UserController } from './use-cases/UserController';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { EmailService } from './services/EmailService';
import { ApplicationService } from './services/ApplicationService';
import { UserRepository } from './repositories/UserRepository';

// Lazy loading setup for transient dependencies
const createUserUseCaseFactory = (): CreateUserUseCase => new CreateUserUseCase(getUserRepository(), getEmailService());

// Lazy initialization variables for singletons
let applicationService: ApplicationService | undefined;
let userController: UserController | undefined;
let getUserUseCase: GetUserUseCase | undefined;
let emailService: EmailService | undefined;
let userRepository: UserRepository | undefined;

// Lazy getter functions for singletons
const getUserRepository = (): UserRepository => {
  if (!userRepository) {
    userRepository = new UserRepository();
  }
  return userRepository;
};
const getEmailService = (): EmailService => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};
const getGetUserUseCase = (): GetUserUseCase => {
  if (!getUserUseCase) {
    getUserUseCase = new GetUserUseCase(getUserRepository());
  }
  return getUserUseCase;
};
const getUserController = (): UserController => {
  if (!userController) {
    userController = new UserController(createUserUseCaseFactory(), getGetUserUseCase());
  }
  return userController;
};
const getApplicationService = (): ApplicationService => {
  if (!applicationService) {
    applicationService = new ApplicationService(getUserController());
  }
  return applicationService;
};

export const container = {
  get UserController(): UserController {
    return getUserController();
  },
  get GetUserUseCase(): GetUserUseCase {
    return getGetUserUseCase();
  },
  get IEmailService(): EmailService {
    return getEmailService();
  },
  get IApplicationService(): ApplicationService {
    return getApplicationService();
  },
  get IUserRepository(): UserRepository {
    return getUserRepository();
  },
  get CreateUserUseCase(): CreateUserUseCase {
    return createUserUseCaseFactory();
  },
};

export type Container = typeof container;
