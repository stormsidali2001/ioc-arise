# @notjustcoders/di-container

A lightweight, type-safe dependency injection (DI) framework for TypeScript with **zero decorators**. Perfect for clean architecture applications.

## Features

✨ **Zero Decorators** - No decorator syntax required  
🔒 **Type-Safe** - Full TypeScript support with autocomplete  
🪶 **Lightweight** - Minimal runtime footprint  
📦 **Modular** - Built-in module system for organizing dependencies  
🔄 **Lifecycle Management** - Singleton and Transient scopes  
🎯 **Clean Architecture** - Perfect for hexagonal/clean architecture patterns  
⚡ **Fast** - Optimized for performance  

## Installation

```bash
npm install @notjustcoders/di-container
```

or

```bash
yarn add @notjustcoders/di-container
```

or

```bash
pnpm add @notjustcoders/di-container
```

## Quick Start

### 1. Define Your Services

```typescript
// services/UserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User>;
  save(user: User): Promise<void>;
}

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User> {
    // Implementation
  }
  
  async save(user: User): Promise<void> {
    // Implementation
  }
}

// services/UserService.ts
export class UserService {
  constructor(private userRepository: IUserRepository) {}
  
  async getUser(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }
}
```

### 2. Set Up the Container

```typescript
import { Container, Lifecycle } from '@notjustcoders/di-container';

const container = new Container();

// Register interface with string token
container.register('IUserRepository', {
  useClass: UserRepository,
  lifecycle: Lifecycle.Singleton
});

// Register service with dependencies
container.register(UserService, {
  useClass: UserService,
  dependencies: ['IUserRepository'],
  lifecycle: Lifecycle.Transient
});
```

### 3. Resolve and Use

```typescript
// Resolve by interface name
const userRepo = container.resolve('IUserRepository');

// Resolve by class
const userService = container.resolve(UserService);

await userService.getUser('123');
```

## Type Safety

Enable full type safety with TypeScript:

```typescript
// Define your registry
interface AppRegistry {
  'IUserRepository': IUserRepository;
  'IEmailService': IEmailService;
}

// Create typed container
const container = new Container<AppRegistry>();

// Now you get autocomplete and type checking!
const repo = container.resolve('IUserRepository'); // Type: IUserRepository
```

## Module System

Organize your dependencies into modules:

```typescript
import { ContainerModule, Lifecycle } from '@notjustcoders/di-container';

// Create a module
const userModule = new ContainerModule()
  .register('IUserRepository', {
    useClass: UserRepository,
    lifecycle: Lifecycle.Singleton
  })
  .register('IUserService', {
    useClass: UserService,
    dependencies: ['IUserRepository'],
    lifecycle: Lifecycle.Transient
  });

// Register module in container
container.registerModule(userModule);
```

## Lifecycle Management

### Singleton

One instance shared across the entire application:

```typescript
container.register('IUserRepository', {
  useClass: UserRepository,
  lifecycle: Lifecycle.Singleton // Same instance every time
});
```

### Transient

New instance created every time:

```typescript
container.register('IEmailService', {
  useClass: EmailService,
  lifecycle: Lifecycle.Transient // New instance each resolve
});
```

## Token Types

`ioc-arise` supports multiple token types:

### String Tokens (for interfaces)

```typescript
container.register('IUserRepository', {
  useClass: UserRepository
});

const repo = container.resolve('IUserRepository');
```

### Class Constructors

```typescript
container.register(UserService, {
  useClass: UserService
});

const service = container.resolve(UserService);
```

### Symbol Tokens

```typescript
const USER_REPO = Symbol('IUserRepository');

container.register(USER_REPO, {
  useClass: UserRepository
});

const repo = container.resolve(USER_REPO);
```

## Child Containers

Create scoped containers for testing or isolation:

```typescript
const parentContainer = new Container();
parentContainer.register('IConfig', {
  useClass: ProductionConfig,
  lifecycle: Lifecycle.Singleton
});

// Child inherits from parent
const childContainer = parentContainer.createChild();
childContainer.register('IUserService', {
  useClass: UserService,
  dependencies: ['IConfig'] // Resolved from parent
});
```

## Abstract Classes

Use abstract classes as dependencies:

```typescript
abstract class AbstractRepository {
  abstract findById(id: string): Promise<any>;
}

class UserRepository extends AbstractRepository {
  async findById(id: string): Promise<User> {
    // Implementation
  }
}

// Register with string token
container.register('AbstractRepository', {
  useClass: UserRepository
});

// Use in dependencies
container.register(UserService, {
  useClass: UserService,
  dependencies: ['AbstractRepository']
});
```

## Error Handling

`ioc-arise` provides clear error messages:

```typescript
// Missing provider
container.resolve('NonExistent');
// Error: No provider found for token: NonExistent

// Circular dependencies
container.register('ServiceA', {
  useClass: ServiceA,
  dependencies: ['ServiceB']
});
container.register('ServiceB', {
  useClass: ServiceB,
  dependencies: ['ServiceA']
});
container.resolve('ServiceA');
// Error: Circular dependency detected: ServiceA -> ServiceB -> ServiceA
```

## Integration with IOC-Arise CLI

For automatic container generation, use the [`@notjustcoders/ioc-arise`](https://www.npmjs.com/package/@notjustcoders/ioc-arise) CLI tool:

```bash
npm install -D @notjustcoders/ioc-arise
```

The CLI analyzes your TypeScript code and generates container configuration automatically.

## API Reference

### Container

#### `new Container<TRegistry>(parent?: Container<TRegistry>)`
Creates a new container instance.

#### `register<T>(token: Token<T>, provider: Provider<T>): void`
Registers a provider in the container.

#### `resolve<T>(token: Token<T>): T`
Resolves an instance from the container.

#### `registerModule(module: ContainerModule): void`
Registers all providers from a module.

#### `createChild(): IContainer<TRegistry>`
Creates a child container that inherits from the parent.

### ContainerModule

#### `new ContainerModule()`
Creates a new module instance.

#### `register<T>(token: Token<T>, provider: Provider<T>): this`
Registers a provider in the module (chainable).

### Lifecycle

#### `Lifecycle.Singleton`
One instance shared across the application.

#### `Lifecycle.Transient`
New instance created every time.

## Best Practices

1. **Use interfaces for dependencies** - Improves testability and decoupling
2. **Prefer Singleton for stateless services** - Better performance
3. **Use modules for organization** - Group related providers
4. **Type your registry** - Enable full type safety
5. **Register at application startup** - Not at runtime during request handling

## Examples

Check out the [examples directory](https://github.com/stormsidali2001/ioc-arise/tree/main/apps/ioc-maker-cli/examples) for complete working examples:

- **minimal-todo** - Getting started
- **clean-architecture** - Multi-module application
- **abstract-classes-example** - Abstract class dependencies
- **simple-modules** - Module system basics

## Why @notjustcoders/di-container?

### vs. Traditional DI Frameworks

- ❌ **InversifyJS** - Requires decorators and reflect-metadata
- ❌ **TypeDI** - Requires decorators
- ❌ **TSyringe** - Requires decorators and reflect-metadata
- ✅ **@notjustcoders/di-container** - No decorators, pure TypeScript

### vs. Manual DI

- ❌ **Manual** - Verbose, error-prone, no lifecycle management
- ✅ **@notjustcoders/di-container** - Automatic, type-safe, with lifecycle support

## License

MIT © [Sid Ali Assoul](https://github.com/stormsidali2001)

## Contributing

Contributions are welcome! Please read our [contributing guide](https://github.com/stormsidali2001/ioc-arise/blob/main/CONTRIBUTING.md).

## Links

- [Documentation](https://ioc-arise.notjustcoders.com)
- [GitHub Repository](https://github.com/stormsidali2001/ioc-arise)
- [CLI Tool](https://www.npmjs.com/package/@notjustcoders/ioc-arise)
- [Issue Tracker](https://github.com/stormsidali2001/ioc-arise/issues)

