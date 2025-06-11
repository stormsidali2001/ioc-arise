---
title: Module Organization
description: Learn how to organize your dependencies into logical modules with IoC Arise
---

## What are Modules?

Modules in IoC Arise allow you to organize your dependencies into logical groups. This is especially useful for:

- **Large applications** with many dependencies
- **Clean Architecture** implementations
- **Domain-driven design** patterns
- **Microservice-style** modular monoliths
- **Feature-based** organization

## Basic Module Configuration

Define modules in your `ioc.config.json` file:

```json
{
  "source": "src",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "modules": {
    "UserModule": [
      "use-cases/*User*",
      "repositories/UserRepository.ts",
      "presenters/*User*"
    ],
    "ProductModule": [
      "use-cases/*Product*",
      "repositories/ProductRepository.ts",
      "services/*Product*"
    ]
  }
}
```

## Module Patterns

Module patterns use glob-style matching to include files:

### Wildcard Patterns

```json
{
  "modules": {
    "UserModule": [
      "**/User*",           // Any file starting with "User"
      "**/*User*",          // Any file containing "User"
      "user/**/*",          // All files in user directory
      "**/user-*.ts"        // Files matching pattern
    ]
  }
}
```

### Specific File Patterns

```json
{
  "modules": {
    "CoreModule": [
      "repositories/UserRepository.ts",
      "repositories/ProductRepository.ts",
      "services/EmailService.ts"
    ]
  }
}
```

### Directory-based Patterns

```json
{
  "modules": {
    "DomainModule": [
      "domain/**/*",        // All files in domain folder
      "entities/**/*",      // All entities
      "value-objects/**/*"  // All value objects
    ]
  }
}
```

## Generated Module Containers

When you define modules, IoC Arise generates separate container functions for each module:

```typescript
// Generated container.gen.ts

// Individual module container functions
function createUserModuleContainer() {
  const getUserPresenterFactory = (): GetUserPresenter => new GetUserPresenter();
  const createUserPresenterFactory = (): CreateUserPresenter => new CreateUserPresenter();

  const userRepository = new UserRepository();
  const getUserUseCase = new GetUserUseCase(userRepository, getUserPresenterFactory());
  const createUserUseCase = new CreateUserUseCase(userRepository, createUserPresenterFactory());

  return {
    IUserRepository: userRepository,
    IGetUserInputPort: getUserUseCase,
    ICreateUserInputPort: createUserUseCase,
    get IGetUserOutputPort(): GetUserPresenter {
      return getUserPresenterFactory();
    },
    get ICreateUserOutputPort(): CreateUserPresenter {
      return createUserPresenterFactory();
    }
  };
}

function createTodoModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {
  const createTodoPresenterFactory = (): CreateTodoPresenter => new CreateTodoPresenter();

  const todoRepository = new TodoRepository();
  const createTodoUseCase = new CreateTodoUseCase(
    userModuleContainer.IUserRepository, // Cross-module dependency
    createTodoPresenterFactory()
  );

  return {
    ITodoRepository: todoRepository,
    ICreateTodoInputPort: createTodoUseCase,
    get ICreateTodoOutputPort(): CreateTodoPresenter {
      return createTodoPresenterFactory();
    }
  };
}

// Module instances
const userModuleContainer = createUserModuleContainer();
const todoModuleContainer = createTodoModuleContainer(userModuleContainer);

// Combined container with module structure
export const container = {
  userModule: userModuleContainer,
  todoModule: todoModuleContainer
};

export type Container = typeof container;
```

## Cross-Module Dependencies

IoC Arise automatically handles dependencies between modules by passing module containers as parameters:

```typescript
// CreateTodoUseCase depends on UserRepository from UserModule
export class CreateTodoUseCase implements ICreateTodoInputPort {
  constructor(
    private userRepository: IUserRepository,  // From UserModule
    private outputPort: ICreateTodoOutputPort // From TodoModule
  ) {}
}
```

Generated container handles cross-module dependencies:

```typescript
// TodoModule receives UserModule as dependency
function createTodoModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {
  const createTodoUseCase = new CreateTodoUseCase(
    userModuleContainer.IUserRepository, // Cross-module dependency
    createTodoPresenterFactory()
  );
  
  return {
    ITodoRepository: todoRepository,
    ICreateTodoInputPort: createTodoUseCase
  };
}

// Module instantiation with dependency injection
const userModuleContainer = createUserModuleContainer();
const todoModuleContainer = createTodoModuleContainer(userModuleContainer);
```

## Module Organization Strategies

### 1. Feature-Based Modules

Organize by business features:

```json
{
  "modules": {
    "AuthenticationModule": [
      "features/auth/**/*",
      "use-cases/*Auth*",
      "services/*Auth*"
    ],
    "UserManagementModule": [
      "features/users/**/*",
      "use-cases/*User*",
      "repositories/UserRepository.ts"
    ],
    "OrderProcessingModule": [
      "features/orders/**/*",
      "use-cases/*Order*",
      "services/*Order*"
    ]
  }
}
```

### 2. Layer-Based Modules

Organize by architectural layers:

```json
{
  "modules": {
    "DomainModule": [
      "entities/**/*",
      "value-objects/**/*",
      "domain-services/**/*"
    ],
    "ApplicationModule": [
      "use-cases/**/*",
      "application-services/**/*"
    ],
    "InfrastructureModule": [
      "repositories/**/*",
      "external-services/**/*",
      "adapters/**/*"
    ],
    "PresentationModule": [
      "presenters/**/*",
      "controllers/**/*",
      "view-models/**/*"
    ]
  }
}
```

### 3. Clean Architecture Modules

Organize following Clean Architecture principles:

```json
{
  "modules": {
    "CoreModule": [
      "entities/**/*",
      "use-cases/**/*",
      "ports/**/*"
    ],
    "AdaptersModule": [
      "repositories/**/*",
      "presenters/**/*",
      "controllers/**/*"
    ],
    "InfrastructureModule": [
      "database/**/*",
      "external-apis/**/*",
      "messaging/**/*"
    ]
  }
}
```

### 4. Domain-Driven Design Modules

Organize by bounded contexts:

```json
{
  "modules": {
    "UserContextModule": [
      "contexts/user/**/*",
      "**/*User*"
    ],
    "OrderContextModule": [
      "contexts/order/**/*",
      "**/*Order*"
    ],
    "PaymentContextModule": [
      "contexts/payment/**/*",
      "**/*Payment*"
    ],
    "SharedKernelModule": [
      "shared/**/*",
      "common/**/*"
    ]
  }
}
```

## Using Module Containers

### Access Specific Module

```typescript
import { container } from './container.gen';

// Use only user-related dependencies
const userRepository = container.userModule.IUserRepository;
const createUserUseCase = container.userModule.ICreateUserInputPort;
const user = await createUserUseCase.execute({ name: 'John', email: 'john@example.com' });
```

### Access Combined Container

```typescript
import { container } from './container.gen';

// Access dependencies from any module
const userRepository = container.userModule.IUserRepository;
const todoRepository = container.todoModule.ITodoRepository;
```

### Dependency Injection in Tests

```typescript
import { Container } from './container.gen';

// Mock specific module for testing
const mockContainer: Partial<Container> = {
  userModule: {
    IUserRepository: new MockUserRepository(),
    ICreateUserInputPort: new MockCreateUserUseCase()
  }
};
```

## Module Validation

IoC Arise validates your module configuration:

### Common Validation Errors

```bash
❌ Module configuration errors:
   - Module 'UserModule' has no matching files
   - Pattern 'invalid/**' in module 'TestModule' is invalid
   - Duplicate class 'UserService' found in multiple modules
```

### Best Practices for Module Patterns

1. **Be Specific**: Use specific patterns to avoid unintended inclusions
2. **Avoid Overlaps**: Don't include the same class in multiple modules
3. **Test Patterns**: Use `ioc-arise analyze` to verify your patterns
4. **Document Modules**: Add comments explaining module purposes

## Advanced Module Features

### Conditional Module Loading

```typescript
// Load modules based on environment
const isDevelopment = process.env.NODE_ENV === 'development';

const activeContainer = isDevelopment 
  ? { 
      ...container, 
      developmentModule: createDevelopmentModuleContainer() 
    }
  : container;
```

### Module Composition

```typescript
// Compose custom containers from modules
export const apiContainer = {
  userModule: container.userModule,
  productModule: container.productModule,
  // Exclude heavy modules for API-only usage
};

export const backgroundJobContainer = {
  notificationModule: container.notificationModule,
  reportingModule: container.reportingModule,
  // Include only modules needed for background jobs
};
```

### Module Lazy Loading

```typescript
// Lazy load modules when needed
class ModuleLoader {
  private static _userModule: ReturnType<typeof createUserModuleContainer> | null = null;
  
  static get userModule(): ReturnType<typeof createUserModuleContainer> {
    if (!this._userModule) {
      this._userModule = createUserModuleContainer();
    }
    return this._userModule;
  }
}
```

## Troubleshooting Modules

### Debug Module Patterns

```bash
# Analyze which files match your patterns
ioc-arise analyze --source src --verbose

# Check module configuration
ioc-arise generate --check-cycles --verbose
```

### Common Issues

1. **No Files Match Pattern**: Check your glob patterns
2. **Cross-Module Dependencies**: Ensure all dependencies are included
3. **Circular Dependencies**: Review module boundaries
4. **Performance Issues**: Consider module size and complexity

## Next Steps

- Learn about [Best Practices](/guides/best-practices/) for module organization
- Explore [Configuration Reference](/reference/configuration/) for all module options
- Check out [Examples](/guides/examples/) with different module strategies