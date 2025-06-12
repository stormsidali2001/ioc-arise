import { UserController } from './use-cases/UserController';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { UserRepository } from './repositories/UserRepository';
import { EmailService } from './services/EmailService';
import { ApplicationService } from './services/ApplicationService';

// Lazy initialization variables for singletons
let applicationService: ApplicationService | undefined;
let userController: UserController | undefined;
let getUserUseCase: GetUserUseCase | undefined;
let createUserUseCase: CreateUserUseCase | undefined;
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
const getCreateUserUseCase = (): CreateUserUseCase => {
  if (!createUserUseCase) {
    createUserUseCase = new CreateUserUseCase(getUserRepository(), getEmailService());
  }
  return createUserUseCase;
};
const getGetUserUseCase = (): GetUserUseCase => {
  if (!getUserUseCase) {
    getUserUseCase = new GetUserUseCase(getUserRepository());
  }
  return getUserUseCase;
};
const getUserController = (): UserController => {
  if (!userController) {
    userController = new UserController(getCreateUserUseCase(), getGetUserUseCase());
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
  get CreateUserUseCase(): CreateUserUseCase {
    return getCreateUserUseCase();
  },
  get IUserRepository(): UserRepository {
    return getUserRepository();
  },
  get IEmailService(): EmailService {
    return getEmailService();
  },
  get IApplicationService(): ApplicationService {
    return getApplicationService();
  },
};

export type Container = typeof container;
