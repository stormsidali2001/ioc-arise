// Test fixtures for AST parser tests

export const testFileContents = {
  // parseFile test fixtures
  basicClass: `
class TestClass {
  constructor() {}
}
`,
  
  emptyFile: '',
  
  // findClassesImplementingInterfaces test fixtures
  classWithInterface: `
interface IUserService {
  getUser(): string;
}

class UserService implements IUserService {
  getUser(): string {
    return 'user';
  }
}

class RegularClass {
  doSomething() {}
}
`,
  
  regularClassOnly: `
class RegularClass {
  doSomething() {}
}
`,
  
  multipleInterfaceClasses: `
interface IUserService {
  getUser(): string;
}

interface IEmailService {
  sendEmail(): void;
}

class UserService implements IUserService {
  getUser(): string {
    return 'user';
  }
}

class EmailService implements IEmailService {
  sendEmail(): void {}
}
`,

  // findAllClasses test fixtures
  mixedClasses: `
interface IUserService {
  getUser(): string;
}

class UserService implements IUserService {
  constructor(private userRepo: UserRepository) {}
  getUser(): string {
    return 'user';
  }
}

class UserRepository {
  constructor() {}
  findUser(): any {
    return {};
  }
}

class EmailService {
  constructor(private logger: Logger) {}
  sendEmail(): void {}
}
`,

  onlyRegularClasses: `
class UserRepository {
  constructor() {}
  findUser(): any {
    return {};
  }
}

class EmailService {
  constructor(private logger: Logger) {}
  sendEmail(): void {}
}

class Logger {
  log(message: string): void {
    console.log(message);
  }
}
`,
  
  // extractClassName test fixtures
  simpleClassName: `
class UserService implements IUserService {
  constructor() {}
}
`,
  
  complexClassName: `
class User_Service_123 implements IUserService {
  constructor() {}
}
`,
  
  interfaceOnly: `
interface IUserService {
  getUser(): string;
}
`,
  
  // extractInterfaceName test fixtures
  singleInterface: `
class UserService implements IUserService {
  constructor() {}
}
`,
  
  multipleInterfaces: `
class UserService implements IUserService, ILoggable {
  constructor() {}
}
`,
  
  // extractConstructorParameters test fixtures
  constructorWithParams: `
class UserService implements IUserService {
  constructor(private userRepo: UserRepository, public logger: Logger) {}
}
`,
  
  optionalParameters: `
class UserService implements IUserService {
  constructor(private userRepo: UserRepository, logger?: Logger) {}
}
`,
  
  noConstructor: `
class UserService implements IUserService {
  getUser(): string {
    return 'user';
  }
}
`,
  
  emptyConstructor: `
class UserService implements IUserService {
  constructor() {}
}
`,
  
  protectedParameter: `
class UserService implements IUserService {
  constructor(protected userRepo: UserRepository) {}
}
`,
  
  // extractJSDocComments test fixtures
  jsDocWithScope: `
/**
 * @scope singleton
 */
class UserService implements IUserService {
  constructor() {}
}

/**
 * @scope transient
 */
class EmailService implements IEmailService {
  constructor() {}
}
`,
  
  noJSDoc: `
class UserService implements IUserService {
  constructor() {}
}
`,
  
  regularComments: `
/**
 * This is a regular comment
 * @param something
 */
class UserService implements IUserService {
  constructor() {}
}
`,
  
  malformedJSDoc: `
/**
 * @scope invalid_scope
 */
class UserService implements IUserService {
  constructor() {}
}
`,
  
  // extractTypeAliases test fixtures
  typeAliases: `
import { UserRepository as UserRepo } from './user-repository';
import { Logger as AppLogger } from './logger';
import { SomeClass } from './some-class';

class UserService implements IUserService {
  constructor(private userRepo: UserRepo, private logger: AppLogger) {}
}
`,
  
  noAliases: `
import { UserRepository } from './user-repository';
import { Logger } from './logger';

class UserService implements IUserService {
  constructor(private userRepo: UserRepository) {}
}
`,
  
  noImports: `
class UserService implements IUserService {
  constructor() {}
}
`,
  
  complexImports: `
import {   UserRepository   as   UserRepo   } from './user-repository';
import {Logger as AppLogger} from './logger';

class UserService implements IUserService {
  constructor() {}
}
`
};