import { UserController } from './use-cases/UserController';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { EmailService } from './services/EmailService';
import { ApplicationService } from './services/ApplicationService';
import { UserRepository } from './repositories/UserRepository';

function createCoreModuleContainer() {

  let applicationService: ApplicationService | undefined;
  let createUserUseCase: CreateUserUseCase | undefined;
  let emailService: EmailService | undefined;
  let getUserUseCase: GetUserUseCase | undefined;
  let userRepository: UserRepository | undefined;
  let userController: UserController | undefined;

  const getApplicationService = (): ApplicationService => {
    if (!applicationService) {
      applicationService = new ApplicationService(getUserController());
    }
    return applicationService;
  };
  const getCreateUserUseCase = (): CreateUserUseCase => {
    if (!createUserUseCase) {
      createUserUseCase = new CreateUserUseCase(getUserRepository(), getEmailService());
    }
    return createUserUseCase;
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
  const getUserRepository = (): UserRepository => {
    if (!userRepository) {
      userRepository = new UserRepository();
    }
    return userRepository;
  };
  const getUserController = (): UserController => {
    if (!userController) {
      userController = new UserController(getCreateUserUseCase(), getGetUserUseCase());
    }
    return userController;
  };

  return {
        get UserController(): UserController {
          return getUserController();
        },
        get GetUserUseCase(): GetUserUseCase {
          return getGetUserUseCase();
        },
        get CreateUserUseCase(): CreateUserUseCase {
          return getCreateUserUseCase();
        },
        get EmailService(): EmailService {
          return getEmailService();
        },
        get IEmailService(): EmailService {
          return getEmailService();
        },
        get ApplicationService(): ApplicationService {
          return getApplicationService();
        },
        get IApplicationService(): ApplicationService {
          return getApplicationService();
        },
        get UserRepository(): UserRepository {
          return getUserRepository();
        },
        get IUserRepository(): UserRepository {
          return getUserRepository();
        }
  };
}

const coreModuleContainer = createCoreModuleContainer();

export const container = {
  coreModule: coreModuleContainer
};

export type Container = typeof container;
