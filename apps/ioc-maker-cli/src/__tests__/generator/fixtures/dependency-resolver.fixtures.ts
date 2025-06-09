import { ClassInfo, InjectionScope } from '../../../types';

// Basic managed classes for testing
export const basicManagedClasses: ClassInfo[] = [
  {
    name: 'UserService',
    filePath: '/src/services/user.service.ts',
    dependencies: ['IUserRepository'],
    constructorParams: [
      {
        name: 'userRepository',
        type: 'IUserRepository',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IUserService',
    importPath: './services/user.service',
    scope: 'singleton' as InjectionScope
  },
  {
    name: 'UserRepository',
    filePath: '/src/repositories/user.repository.ts',
    dependencies: [],
    constructorParams: [],
    interfaceName: 'IUserRepository',
    importPath: './repositories/user.repository',
    scope: 'singleton' as InjectionScope
  }
];

// Classes with transient scope
export const transientClasses: ClassInfo[] = [
  {
    name: 'EmailService',
    filePath: '/src/services/email.service.ts',
    dependencies: ['IEmailProvider'],
    constructorParams: [
      {
        name: 'emailProvider',
        type: 'IEmailProvider',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IEmailService',
    importPath: './services/email.service',
    scope: 'transient' as InjectionScope
  },
  {
    name: 'EmailProvider',
    filePath: '/src/providers/email.provider.ts',
    dependencies: [],
    constructorParams: [],
    interfaceName: 'IEmailProvider',
    importPath: './providers/email.provider',
    scope: 'transient' as InjectionScope
  }
];

// Classes with mixed dependencies (managed and unmanaged)
export const mixedDependencyClasses: ClassInfo[] = [
  {
    name: 'OrderService',
    filePath: '/src/services/order.service.ts',
    dependencies: ['IUserService', 'PaymentGateway', 'Logger'],
    constructorParams: [
      {
        name: 'userService',
        type: 'IUserService',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'paymentGateway',
        type: 'PaymentGateway',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'logger',
        type: 'Logger',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IOrderService',
    importPath: './services/order.service',
    scope: 'singleton' as InjectionScope
  },
  ...basicManagedClasses
];

// Unmanaged classes with constructor parameters
export const unmanagedClassesWithParams: ClassInfo[] = [
  {
    name: 'DatabaseConnection',
    filePath: '/src/database/connection.ts',
    dependencies: [],
    constructorParams: [
      {
        name: 'host',
        type: 'string',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'port',
        type: 'number',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'ssl',
        type: 'boolean',
        isOptional: true,
        accessModifier: 'private'
      }
    ],
    importPath: './database/connection',
    scope: 'singleton' as InjectionScope
  },
  {
    name: 'ConfigService',
    filePath: '/src/config/config.service.ts',
    dependencies: [],
    constructorParams: [
      {
        name: 'config',
        type: 'Config',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'env',
        type: 'Environment',
        isOptional: true,
        accessModifier: 'private'
      }
    ],
    importPath: './config/config.service',
    scope: 'singleton' as InjectionScope
  }
];

// Classes without interface names
export const classesWithoutInterfaces: ClassInfo[] = [
  {
    name: 'UtilityService',
    filePath: '/src/utils/utility.service.ts',
    dependencies: [],
    constructorParams: [],
    importPath: './utils/utility.service',
    scope: 'singleton' as InjectionScope
  },
  {
    name: 'HelperService',
    filePath: '/src/helpers/helper.service.ts',
    dependencies: ['UtilityService'],
    constructorParams: [
      {
        name: 'utilityService',
        type: 'UtilityService',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    importPath: './helpers/helper.service',
    scope: 'singleton' as InjectionScope
  }
];

// Complex scenario with circular dependencies
export const circularDependencyClasses: ClassInfo[] = [
  {
    name: 'ServiceA',
    filePath: '/src/services/service-a.ts',
    dependencies: ['IServiceB'],
    constructorParams: [
      {
        name: 'serviceB',
        type: 'IServiceB',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IServiceA',
    importPath: './services/service-a',
    scope: 'singleton' as InjectionScope
  },
  {
    name: 'ServiceB',
    filePath: '/src/services/service-b.ts',
    dependencies: ['IServiceA'],
    constructorParams: [
      {
        name: 'serviceA',
        type: 'IServiceA',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IServiceB',
    importPath: './services/service-b',
    scope: 'singleton' as InjectionScope
  }
];

// Test class for dependency resolution
export const testClassForResolution: ClassInfo = {
  name: 'TestService',
  filePath: '/src/services/test.service.ts',
  dependencies: ['IUserService', 'IEmailService', 'UnmanagedClass'],
  constructorParams: [
    {
      name: 'userService',
      type: 'IUserService',
      isOptional: false,
      accessModifier: 'private'
    },
    {
      name: 'emailService',
      type: 'IEmailService',
      isOptional: false,
      accessModifier: 'private'
    },
    {
      name: 'unmanagedClass',
      type: 'UnmanagedClass',
      isOptional: false,
      accessModifier: 'private'
    }
  ],
  interfaceName: 'ITestService',
  importPath: './services/test.service',
  scope: 'singleton' as InjectionScope
};

// Expected results for various test scenarios
export const expectedResults = {
  basicInterfaceToClassMap: new Map([
    ['IUserService', 'UserService'],
    ['IUserRepository', 'UserRepository']
  ]),
  transientInterfaceToClassMap: new Map([
    ['IEmailService', 'EmailService'],
    ['IEmailProvider', 'EmailProvider']
  ]),
  mixedDependenciesResolution: 'userService, new PaymentGateway(), new Logger()',
  transientDependenciesResolution: 'emailProviderFactory()',
  singletonDependenciesResolution: 'userRepository',
  unmanagedWithParamsResolution: 'new DatabaseConnection("default", 0, undefined)',
  primitiveTypesDefaults: {
    string: '"default"',
    number: '0',
    boolean: 'false',
    date: 'new Date()'
  }
};