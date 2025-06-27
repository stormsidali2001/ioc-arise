import { UserController } from './use-cases/UserController';
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { UserRepository } from './repositories/UserRepository';
import { EmailService } from './services/EmailService';
import { ApplicationService } from './services/ApplicationService';

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
        get UserRepository(): UserRepository {
          return getUserRepository();
        },
        get IUserRepository(): UserRepository {
          return getUserRepository();
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
        }
  };
}

const coreModuleContainer = createCoreModuleContainer();

export const container = {
  coreModule: coreModuleContainer
};

export type Container = typeof container;

// 🎯 Auto-generate all possible paths using TypeScript
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T]: K extends string
    ? T[K] extends object
      ? Prefix extends ""
        ? K | `${K}.${Paths<T[K]>}`
        : `${Prefix}.${K}` | `${Prefix}.${K}.${Paths<T[K]>}`
      : Prefix extends ""
        ? K
        : `${Prefix}.${K}`
    : never;
}[keyof T];

// ✨ All container keys automatically derived!
export type ContainerKey = Paths<Container>;

// 🎯 Auto-resolve return types using template literals
type GetByPath<T, P extends string> = 
  P extends keyof T
    ? T[P]
    : P extends `${infer K}.${infer Rest}`
      ? K extends keyof T
        ? GetByPath<T[K], Rest>
        : never
      : never;

const CONTAINER_INIT_KEY = Symbol.for('ioc-container-initialized');

export function onInit(): void {
  // TODO: Implement your post-construction logic here
}

export function inject<T extends ContainerKey>(key: T): GetByPath<Container, T> {
  if (!(globalThis as any)[CONTAINER_INIT_KEY]) {
    onInit();
    (globalThis as any)[CONTAINER_INIT_KEY] = true;
  }
  
  // Parse path and traverse object
  const parts = key.split('.');
  let current: any = container;
  
  for (const part of parts) {
    current = current[part];
  }
  
  return current;
}
