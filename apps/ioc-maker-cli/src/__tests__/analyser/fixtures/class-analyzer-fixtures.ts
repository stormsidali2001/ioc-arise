import { ClassInfo, ConstructorParameter, InjectionScope } from '../../../types';

// Test file contents for different scenarios
export const testFileContents = {
  // Basic class implementing an interface
  basicClassWithInterface: `
import { IUserService } from './interfaces/IUserService';
import { IUserRepository } from './interfaces/IUserRepository';
import { ILogger } from './interfaces/ILogger';

export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private logger: ILogger
  ) {}

  async getUser(id: string): Promise<User> {
    this.logger.log('Getting user');
    return this.userRepository.findById(id);
  }
}
`,

  // Class with JSDoc scope annotation
  classWithJSDocScope: `
import { IEmailService } from './interfaces/IEmailService';
import { ITemplateEngine } from './interfaces/ITemplateEngine';

/**
 * @scope singleton
 */
export class EmailService implements IEmailService {
  constructor(
    private templateEngine: ITemplateEngine
  ) {}

  async sendEmail(to: string, template: string): Promise<void> {
    const content = this.templateEngine.render(template);
    // Send email logic
  }
}
`,

  // Class with type aliases
  classWithTypeAliases: `
import { IPaymentService } from './interfaces/IPaymentService';
import { INotificationService as NotificationSvc } from './interfaces/INotificationService';
import { ILogger as Log } from './interfaces/ILogger';

export class PaymentService implements IPaymentService {
  constructor(
    private notificationService: NotificationSvc,
    private logger: Log
  ) {}

  async processPayment(amount: number): Promise<void> {
    this.logger.log('Processing payment');
    await this.notificationService.notify('Payment processed');
  }
}
`,

  // Class with optional parameters
  classWithOptionalParams: `
import { IOrderService } from './interfaces/IOrderService';
import { IInventoryService } from './interfaces/IInventoryService';
import { ILogger } from './interfaces/ILogger';

export class OrderService implements IOrderService {
  constructor(
    private inventoryService: IInventoryService,
    private logger?: ILogger
  ) {}

  async createOrder(items: string[]): Promise<void> {
    this.logger?.log('Creating order');
    await this.inventoryService.checkAvailability(items);
  }
}
`,

  // Multiple classes in one file
  multipleClasses: `
import { IUserService } from './interfaces/IUserService';
import { IAdminService } from './interfaces/IAdminService';
import { ILogger } from './interfaces/ILogger';
import { IDatabase } from './interfaces/IDatabase';

export class UserService implements IUserService {
  constructor(private logger: ILogger) {}
}

export class AdminService implements IAdminService {
  constructor(
    private database: IDatabase,
    private logger: ILogger
  ) {}
}
`,

  // Class without interface (should be ignored)
  classWithoutInterface: `
export class UtilityClass {
  constructor(private config: any) {}

  doSomething(): void {
    // Implementation
  }
}
`,

  // Empty file
  emptyFile: '',

  // File with syntax errors
  invalidSyntax: `
import { IService } from './interfaces/IService';

export class BrokenService implements IService {
  constructor(
    private dependency: IDependency
  ) {
    // Missing closing brace
`,

  // Class with complex constructor parameters
  complexConstructorParams: `
import { IComplexService } from './interfaces/IComplexService';
import { ILogger } from './interfaces/ILogger';
import { IConfig } from './interfaces/IConfig';

export class ComplexService implements IComplexService {
  constructor(
    private readonly logger: ILogger,
    protected config: IConfig,
    public readonly name: string,
    private optional?: ILogger
  ) {}
}
`,

  // Class with interface pattern that should be filtered
  nonMatchingInterface: `
import { IInternalService } from './interfaces/IInternalService';

export class InternalService implements IInternalService {
  constructor() {}
}
`
};

// Test cases for import path generation
export const importPathTestCases = [
  {
    filePath: '/src/services/user.service.ts',
    expected: './services/user.service'
  },
  {
    filePath: '/src/repositories/user.repository.ts',
    expected: './repositories/user.repository'
  },
  {
    filePath: '/src/utils/logger.ts',
    expected: './utils/logger'
  }
];

// Test cases for generateImportPath method
export const generateImportPathTestCases = [
  {
    sourceDir: '/project/src',
    filePath: '/project/src/services/user.service.ts',
    expected: './services/user.service'
  },
  {
    sourceDir: '/project/src',
    filePath: '/project/src/repositories/data/user.repository.ts',
    expected: './repositories/data/user.repository'
  },
  {
    sourceDir: '/app/source',
    filePath: '/app/source/utils/logger.ts',
    expected: './utils/logger'
  }
];

// Mock constructor parameters for dependency resolution tests
export const dependencyResolutionTestParams = [
  { name: 'userRepo', type: 'IUserRepository', isOptional: false },
  { name: 'logger', type: 'ILogger', isOptional: false },
  { name: 'config', type: 'string', isOptional: false }, // Should be filtered out
  { name: 'count', type: 'number', isOptional: false } // Should be filtered out
];

// Type aliases for dependency resolution tests
export const typeAliasesForDependencyTest = new Map([
  ['UserRepo', 'IUserRepository'],
  ['Log', 'ILogger']
]);

// Constructor parameters with type aliases
export const constructorParamsWithAliases = [
  { name: 'userRepo', type: 'UserRepo', isOptional: false },
  { name: 'logger', type: 'Log', isOptional: false }
];

// Mock ClassInfo objects for testing
export const mockClassInfos: ClassInfo[] = [
  {
    name: 'UserService',
    filePath: '/src/services/user.service.ts',
    dependencies: ['IUserRepository', 'ILogger'],
    constructorParams: [
      {
        name: 'userRepository',
        type: 'IUserRepository',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'logger',
        type: 'ILogger',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IUserService',
    importPath: './services/user.service',
    scope: 'transient' as InjectionScope
  },
  {
    name: 'EmailService',
    filePath: '/src/services/email.service.ts',
    dependencies: ['ITemplateEngine'],
    constructorParams: [
      {
        name: 'templateEngine',
        type: 'ITemplateEngine',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IEmailService',
    importPath: './services/email.service',
    scope: 'singleton' as InjectionScope
  }
];

// Mock constructor parameters for testing
export const mockConstructorParams: ConstructorParameter[] = [
  {
    name: 'userRepository',
    type: 'IUserRepository',
    isOptional: false,
    accessModifier: 'private'
  },
  {
    name: 'logger',
    type: 'ILogger',
    isOptional: true,
    accessModifier: 'private'
  },
  {
    name: 'config',
    type: 'string',
    isOptional: false,
    accessModifier: 'public'
  }
];

// Mock type aliases for testing
export const mockTypeAliases = new Map<string, string>([
  ['NotificationSvc', 'INotificationService'],
  ['Log', 'ILogger'],
  ['DB', 'IDatabase']
]);

// Expected results for various test scenarios
export const expectedResults = {
  basicClass: {
    name: 'UserService',
    interfaceName: 'IUserService',
    dependencies: ['IUserRepository', 'ILogger'],
    importPath: './services/user.service'
  },
  classWithScope: {
    name: 'EmailService',
    interfaceName: 'IEmailService',
    scope: 'singleton' as InjectionScope
  },
  multipleClasses: [
    {
      name: 'UserService',
      interfaceName: 'IUserService'
    },
    {
      name: 'AdminService',
      interfaceName: 'IAdminService'
    }
  ]
};