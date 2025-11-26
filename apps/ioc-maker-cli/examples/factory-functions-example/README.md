# Factory Functions Example

This example demonstrates how to use factory functions with IoC Arise for dependency injection.

## Overview

Factory functions allow you to create instances with custom business logic, validation, or conditional setup that goes beyond simple constructor injection.

## Structure

```
factory-functions-example/
├── repositories/
│   ├── IUserRepository.ts      # Interface
│   ├── UserRepository.ts        # Implementation
│   ├── ITodoRepository.ts      # Interface
│   └── TodoRepository.ts        # Implementation
├── factories/
│   └── todoUseCaseFactory.ts    # Factory function (IS the use case)
├── ioc.config.json              # IoC configuration
└── README.md
```

## Factory Function

The factory function `createTodoUseCase` in `factories/todoUseCaseFactory.ts` **IS the use case itself**:

```typescript
export function createTodoUseCase(
  userRepo: IUserRepository,
  todoRepo: ITodoRepository
) {
  // The factory function itself contains the business logic
  return {
    async createTodo(userId: string, title: string): Promise<void> {
      // Business logic here
      const user = await userRepo.findById(userId);
      // ... rest of logic
    },
    async getUserTodos(userId: string): Promise<number> {
      // More business logic
    }
  };
}
```

## Key Features

1. **Factory Detection**: IoC Arise automatically detects exported functions that:
   - Are marked with `@factory` JSDoc annotation (default behavior)
   - Match the `factoryPattern` regex if configured in `ioc.config.json`
   - Are exported functions

2. **Dependency Injection**: Factory functions receive their dependencies as parameters, which are automatically resolved by the container.

3. **Lifecycle Support**: Factory functions support both singleton and transient scopes (via `@scope` JSDoc comment).

## Generated Container

When you run `ioc-arise generate`, the container will include:

```typescript
container.register('ITodoUseCase', {
  useFactory: createTodoUseCase,
  dependencies: ['IUserRepository', 'ITodoRepository'],
  lifecycle: Lifecycle.Singleton,
});
```

## Usage

```typescript
import { container } from './container.gen';

// Resolve the use case (created via factory)
const todoUseCase = container.resolve('ITodoUseCase');

// Use the use case
await todoUseCase.createTodo('user-1', 'Buy groceries');
```

## Benefits

- **No Classes Needed**: Factory functions can directly implement business logic
- **Custom Logic**: Add validation, logging, or conditional setup
- **Flexibility**: More control over instance creation and structure
- **Testability**: Easy to mock or replace factory functions
- **Type Safety**: Full TypeScript support with dependency injection

## Running the Example

1. Generate the container:
   ```bash
   cd examples/factory-functions-example
   ioc-arise generate
   ```

2. Use the generated container in your application.

