import { ClassInfo, InjectionScope } from '../../../types';

export const mockClassInfos: ClassInfo[] = [
  {
    name: 'UserService',
    filePath: '/src/services/user.service.ts',
    dependencies: ['IUserRepository', 'EmailService'],
    constructorParams: [
      {
        name: 'userRepository',
        type: 'IUserRepository',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'emailService',
        type: 'EmailService',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IUserService',
    importPath: './services/user.service',
    scope: 'singleton' as InjectionScope
  },
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
    name: 'ProductService',
    filePath: '/src/services/product.service.ts',
    dependencies: ['IProductRepository', 'UserService'],
    constructorParams: [
      {
        name: 'productRepository',
        type: 'IProductRepository',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'userService',
        type: 'UserService',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    interfaceName: 'IProductService',
    importPath: './services/product.service',
    scope: 'singleton' as InjectionScope
  }
];

export const mockClassInfoWithNoDependencies: ClassInfo = {
  name: 'LoggerService',
  filePath: '/src/services/logger.service.ts',
  dependencies: [],
  constructorParams: [],
  interfaceName: 'ILoggerService',
  importPath: './services/logger.service',
  scope: 'singleton' as InjectionScope
};

export const mockClassInfoWithUnmanagedDependencies: ClassInfo = {
  name: 'DatabaseService',
  filePath: '/src/services/database.service.ts',
  dependencies: ['Connection', 'IConfig'],
  constructorParams: [
    {
      name: 'connection',
      type: 'Connection',
      isOptional: false,
      accessModifier: 'private'
    },
    {
      name: 'config',
      type: 'IConfig',
      isOptional: false,
      accessModifier: 'private'
    }
  ],
  interfaceName: 'IDatabaseService',
  importPath: './services/database.service',
  scope: 'singleton' as InjectionScope
};

export const expectedImportsForMockClasses = [
  "import { UserService } from './services/user.service';",
  "import { EmailService } from './services/email.service';",
  "import { ProductService } from './services/product.service';"
].join('\n');

export const expectedImportsWithUnmanagedDependencies = [
  "import { UserService } from './services/user.service';",
  "import { EmailService } from './services/email.service';",
  "import { ProductService } from './services/product.service';",
  "import { DatabaseService } from './services/database.service';",
  "import { Connection } from './services/database.service';"
].join('\n');

export const duplicateClassesFixture: ClassInfo[] = [
  {
    name: 'ServiceA',
    filePath: '/src/services/shared.service.ts',
    dependencies: ['SharedDependency'],
    constructorParams: [{
      name: 'sharedDep',
      type: 'SharedDependency',
      isOptional: false,
      accessModifier: 'private'
    }],
    importPath: './services/shared.service',
    scope: 'singleton' as InjectionScope
  },
  {
    name: 'ServiceB',
    filePath: '/src/services/shared.service.ts',
    dependencies: ['SharedDependency'],
    constructorParams: [{
      name: 'sharedDep',
      type: 'SharedDependency',
      isOptional: false,
      accessModifier: 'private'
    }],
    importPath: './services/shared.service',
    scope: 'singleton' as InjectionScope
  }
];

export const circularClassesFixture: ClassInfo[] = [
  {
    name: 'ServiceA',
    filePath: '/src/services/service-a.ts',
    dependencies: ['ServiceB'],
    constructorParams: [{
      name: 'serviceB',
      type: 'ServiceB',
      isOptional: false,
      accessModifier: 'private'
    }],
    importPath: './services/service-a',
    scope: 'singleton' as InjectionScope
  },
  {
    name: 'ServiceB',
    filePath: '/src/services/service-b.ts',
    dependencies: ['ServiceA'],
    constructorParams: [{
      name: 'serviceA',
      type: 'ServiceA',
      isOptional: false,
      accessModifier: 'private'
    }],
    importPath: './services/service-b',
    scope: 'singleton' as InjectionScope
  }
];

export const mixedClassesFixture: ClassInfo[] = [
  {
    name: 'MixedService',
    filePath: '/src/services/mixed.service.ts',
    dependencies: ['UserService', 'ExternalLibrary', 'IConfig'],
    constructorParams: [
      {
        name: 'userService',
        type: 'UserService',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'externalLibrary',
        type: 'ExternalLibrary',
        isOptional: false,
        accessModifier: 'private'
      },
      {
        name: 'config',
        type: 'IConfig',
        isOptional: false,
        accessModifier: 'private'
      }
    ],
    importPath: './services/mixed.service',
    scope: 'singleton' as InjectionScope
  }
];