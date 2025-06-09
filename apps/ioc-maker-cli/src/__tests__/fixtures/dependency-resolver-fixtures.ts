import { ClassInfo } from '../../types';

export const basicMockClasses: ClassInfo[] = [
  {
    name: 'UserService',
    dependencies: ['UserRepository', 'Logger'],
    constructorParams: [
      { name: 'userRepo', type: 'UserRepository', isOptional: false },
      { name: 'logger', type: 'Logger', isOptional: false }
    ],
    scope: 'singleton',
    interfaceName: 'IUserService',
    importPath: './user-service',
    filePath: '/test/user-service.ts'
  },
  {
    name: 'UserRepository',
    dependencies: ['DatabaseConnection'],
    constructorParams: [
      { name: 'db', type: 'DatabaseConnection', isOptional: false }
    ],
    scope: 'singleton',
    interfaceName: 'IUserRepository',
    importPath: './user-repository',
    filePath: '/test/user-repository.ts'
  },
  {
    name: 'DatabaseConnection',
    dependencies: [],
    constructorParams: [],
    scope: 'singleton',
    interfaceName: 'IDatabaseConnection',
    importPath: './database-connection',
    filePath: '/test/database-connection.ts'
  },
  {
    name: 'Logger',
    dependencies: [],
    constructorParams: [],
    scope: 'singleton',
    interfaceName: 'ILogger',
    importPath: './logger',
    filePath: '/test/logger.ts'
  }
];

export const simpleClasses: ClassInfo[] = [
  {
    name: 'SimpleClass',
    dependencies: [],
    constructorParams: [],
    scope: 'singleton',
    importPath: './simple',
    filePath: '/test/simple.ts'
  }
];

export const circularClasses: ClassInfo[] = [
  {
    name: 'ClassA',
    dependencies: ['ClassB'],
    constructorParams: [
      { name: 'classB', type: 'ClassB', isOptional: false }
    ],
    scope: 'singleton',
    importPath: './class-a',
    filePath: '/test/class-a.ts'
  },
  {
    name: 'ClassB',
    dependencies: ['ClassC'],
    constructorParams: [
      { name: 'classC', type: 'ClassC', isOptional: false }
    ],
    scope: 'singleton',
    importPath: './class-b',
    filePath: '/test/class-b.ts'
  },
  {
    name: 'ClassC',
    dependencies: ['ClassA'],
    constructorParams: [
      { name: 'classA', type: 'ClassA', isOptional: false }
    ],
    scope: 'singleton',
    importPath: './class-c',
    filePath: '/test/class-c.ts'
  }
];

export const selfRefClasses: ClassInfo[] = [
  {
    name: 'SelfRef',
    dependencies: ['SelfRef'],
    constructorParams: [
      { name: 'self', type: 'SelfRef', isOptional: false }
    ],
    scope: 'singleton',
    importPath: './self-ref',
    filePath: '/test/self-ref.ts'
  }
];

export const classesWithExternal: ClassInfo[] = [
  {
    name: 'ServiceWithExternal',
    dependencies: ['ManagedDep', 'ExternalLibrary'],
    constructorParams: [
      { name: 'managed', type: 'ManagedDep', isOptional: false },
      { name: 'external', type: 'ExternalLibrary', isOptional: false }
    ],
    scope: 'singleton',
    importPath: './service',
    filePath: '/test/service.ts'
  },
  {
    name: 'ManagedDep',
    dependencies: [],
    constructorParams: [],
    scope: 'singleton',
    importPath: './managed',
    filePath: '/test/managed.ts'
  }
];

export const simpleBinaryCircular: ClassInfo[] = [
  {
    name: 'A',
    dependencies: ['B'],
    constructorParams: [{ name: 'b', type: 'B', isOptional: false }],
    scope: 'singleton',
    importPath: './a',
    filePath: '/test/a.ts'
  },
  {
    name: 'B',
    dependencies: ['A'],
    constructorParams: [{ name: 'a', type: 'A', isOptional: false }],
    scope: 'singleton',
    importPath: './b',
    filePath: '/test/b.ts'
  }
];

export const multiCircularClasses: ClassInfo[] = [
  // First cycle: A -> B -> A
  {
    name: 'A',
    dependencies: ['B'],
    constructorParams: [{ name: 'b', type: 'B', isOptional: false }],
    scope: 'singleton',
    importPath: './a',
    filePath: '/test/a.ts'
  },
  {
    name: 'B',
    dependencies: ['A'],
    constructorParams: [{ name: 'a', type: 'A', isOptional: false }],
    scope: 'singleton',
    importPath: './b',
    filePath: '/test/b.ts'
  },
  // Second cycle: C -> D -> C
  {
    name: 'C',
    dependencies: ['D'],
    constructorParams: [{ name: 'd', type: 'D', isOptional: false }],
    scope: 'singleton',
    importPath: './c',
    filePath: '/test/c.ts'
  },
  {
    name: 'D',
    dependencies: ['C'],
    constructorParams: [{ name: 'c', type: 'C', isOptional: false }],
    scope: 'singleton',
    importPath: './d',
    filePath: '/test/d.ts'
  }
];

export const externalDependencyClasses: ClassInfo[] = [
  {
    name: 'TestClass',
    dependencies: ['ManagedClass', 'ExternalLibrary', 'AnotherExternal'],
    constructorParams: [],
    scope: 'singleton',
    importPath: '/test/test.ts',
    filePath: '/test/test.ts'
  },
  {
    name: 'ManagedClass',
    dependencies: [],
    constructorParams: [],
    scope: 'singleton',
    importPath: '/test/managed.ts',
    filePath: '/test/managed.ts'
  }
];

export const standaloneClasses: ClassInfo[] = [
  {
    name: 'Standalone',
    dependencies: [],
    constructorParams: [],
    scope: 'singleton',
    importPath: '/test/standalone.ts',
    filePath: '/test/standalone.ts'
  }
];

export const diamondClasses: ClassInfo[] = [
  {
    name: 'Top',
    dependencies: ['Left', 'Right'],
    constructorParams: [
      { name: 'left', type: 'Left', isOptional: false },
      { name: 'right', type: 'Right', isOptional: false }
    ],
    scope: 'singleton',
    importPath: '/test/top.ts',
    filePath: '/test/top.ts'
  },
  {
    name: 'Left',
    dependencies: ['Bottom'],
    constructorParams: [
      { name: 'bottom', type: 'Bottom', isOptional: false }
    ],
    scope: 'singleton',
    importPath: '/test/left.ts',
    filePath: '/test/left.ts'
  },
  {
    name: 'Right',
    dependencies: ['Bottom'],
    constructorParams: [
      { name: 'bottom', type: 'Bottom', isOptional: false }
    ],
    scope: 'singleton',
    importPath: '/test/right.ts',
    filePath: '/test/right.ts'
  },
  {
    name: 'Bottom',
    dependencies: [],
    constructorParams: [],
    scope: 'singleton',
    importPath: '/test/bottom.ts',
    filePath: '/test/bottom.ts'
  }
];

export const optionalDepClasses: ClassInfo[] = [
  {
    name: 'ServiceWithOptional',
    dependencies: ['RequiredDep'],
    constructorParams: [
      { name: 'required', type: 'RequiredDep', isOptional: false },
      { name: 'optional', type: 'OptionalDep', isOptional: true }
    ],
    scope: 'singleton',
    importPath: '/test/service.ts',
    filePath: '/test/service.ts'
  },
  {
    name: 'RequiredDep',
    dependencies: [],
    constructorParams: [],
    scope: 'singleton',
    importPath: '/test/required.ts',
    filePath: '/test/required.ts'
  }
];