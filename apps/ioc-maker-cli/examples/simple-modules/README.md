# Simple Modules Example

This example demonstrates IoC Arise's **module system** with two separate modules that work together seamlessly.

## What's Inside

### 🧑 UserModule
- `User` entity
- `IUserRepository` interface
- `UserRepository` implementation
- `IUserService` interface  
- `UserService` implementation

### 📝 TodoModule
- `Todo` entity
- `ITodoRepository` interface
- `TodoRepository` implementation
- `ITodoService` interface
- `TodoService` implementation (depends on UserRepository!)

## The Magic ✨

Notice how `TodoService` depends on `IUserRepository` from a different module:

```typescript
export class TodoService implements ITodoService {
  constructor(
    private todoRepository: ITodoRepository,     // Same module
    private userRepository: IUserRepository      // Different module!
  ) {}
}
```

IoC Arise automatically:
- Discovers dependencies across modules
- Wires everything together
- Generates a unified container

## Running the Example

1. Generate the container:
   ```bash
   npx ioc-arise generate
   ```

2. Run the demo:
   ```bash
   npx tsx demo.ts
   ```

## Key Benefits

- **Modular Organization**: Keep related code together
- **Cross-Module Dependencies**: Services can depend on other modules
- **Zero Configuration**: Just organize your files and add `@scope` annotations
- **Type Safety**: Full TypeScript support across modules

Perfect for larger applications that need clean separation of concerns!