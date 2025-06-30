# Clean Architecture Example

This example demonstrates a comprehensive Clean Architecture implementation using IoC Arise with proper separation of concerns and modular organization.

## Overview

This example showcases Clean Architecture principles with:
- **UserModule**: User domain with use cases, repositories, and presenters
- **TodoModule**: Todo domain with use cases, repositories, and presenters
- **Layered Architecture**: Entities, DTOs, View Models, Ports, Use Cases, Presenters, and Repositories
- **Cross-Module Dependencies**: Todo domain depends on User domain for validation

## Structure

```
clean-architecture/
├── entities/
│   ├── User.ts                     # User domain entity
│   └── Todo.ts                     # Todo domain entity
├── dtos/
│   ├── UserDTOs.ts                 # User Data Transfer Objects
│   └── TodoDTOs.ts                 # Todo Data Transfer Objects
├── view-models/
│   ├── UserViewModels.ts           # User presentation models
│   └── TodoViewModels.ts           # Todo presentation models
├── ports/
│   ├── IInputPort.ts               # Generic input port interface
│   ├── IOutputPort.ts              # Generic output port interface
│   ├── ITodoInputPort.ts           # Todo-specific input port
│   └── ITodoOutputPort.ts          # Todo-specific output port
├── repositories/
│   ├── IUserRepository.ts          # User repository interface
│   ├── UserRepository.ts           # User repository implementation
│   ├── ITodoRepository.ts          # Todo repository interface
│   └── TodoRepository.ts           # Todo repository implementation
├── use-cases/
│   ├── CreateUserUseCase.ts        # User creation use case
│   ├── GetUserUseCase.ts           # User retrieval use case
│   ├── DeleteUserUseCase.ts        # User deletion use case
│   ├── CreateTodoUseCase.ts        # Todo creation use case
│   ├── GetTodoUseCase.ts           # Todo retrieval use case
│   ├── GetTodosByUserUseCase.ts    # Todo-by-user retrieval use case
│   ├── UpdateTodoUseCase.ts        # Todo update use case
│   └── DeleteTodoUseCase.ts        # Todo deletion use case
├── presenters/
│   ├── CreateUserPresenter.ts      # User creation presenter
│   ├── GetUserPresenter.ts         # User retrieval presenter
│   ├── DeleteUserPresenter.ts      # User deletion presenter
│   ├── CreateTodoPresenter.ts      # Todo creation presenter
│   ├── GetTodoPresenter.ts         # Todo retrieval presenter
│   ├── GetTodosByUserPresenter.ts  # Todo-by-user presenter
│   ├── UpdateTodoPresenter.ts      # Todo update presenter
│   └── DeleteTodoPresenter.ts      # Todo deletion presenter
├── UserModule.gen.ts               # Generated user module container
├── TodoModule.gen.ts               # Generated todo module container
├── container.gen.ts                # Main container aggregating modules
├── ioc.config.json                # IoC configuration with module definitions
└── README.md                       # This file
```

## Clean Architecture Layers

### 1. Entities
Core business objects with business rules:
- `User`: User domain entity with business logic
- `Todo`: Todo domain entity with business logic

### 2. DTOs (Data Transfer Objects)
Objects for data transfer between layers:
- `CreateUserDTO`, `UpdateUserDTO`, `UserResponseDTO`
- `CreateTodoDTO`, `UpdateTodoDTO`, `TodoResponseDTO`

### 3. View Models
Presentation-layer data structures:
- `UserViewModel`, `UserListViewModel`
- `TodoViewModel`, `TodoListViewModel`

### 4. Ports (Interfaces)
Contracts for communication between layers:
- `IInputPort<T>`, `IOutputPort<T>` - Generic ports
- `ITodoInputPort`, `ITodoOutputPort` - Todo-specific ports

### 5. Use Cases (Application Layer)
Business logic implementation:
- User operations: Create, Get, Delete
- Todo operations: Create, Get, Update, Delete, GetByUser

### 6. Presenters (Interface Adapters)
Format data for presentation:
- Transform use case outputs to view models
- Handle presentation logic

### 7. Repositories (Infrastructure)
Data access abstraction:
- Interface definition and implementation
- Cross-module data access (Todo → User)

## Key Features

### 1. Modular Organization
```json
{
  "modules": {
    "UserModule": [
      "use-cases/*User*",
      "repositories/UserRepository.ts", 
      "presenters/*User*"
    ],
    "TodoModule": [
      "use-cases/*Todo*",
      "repositories/TodoRepository.ts",
      "presenters/*Todo*"
    ]
  }
}
```

### 2. Cross-Module Dependencies
Todo use cases depend on User repository for validation:

```typescript
export class CreateTodoUseCase {
  constructor(
    private todoRepository: ITodoRepository,     // Same module
    private userRepository: IUserRepository      // Cross-module dependency
  ) {}
}
```

### 3. Clean Architecture Flow
```
Controller → Use Case → Repository
     ↓           ↓
 Presenter ← Output Port
     ↓
View Model → View
```

## Usage

### Running the Example

```bash
# Generate the container
npx ioc-arise generate

# Use in your application
```

### Using the Container

#### Method 1: Direct Container Access

```typescript
import { container } from './container.gen';

// Access user module services
const createUserUseCase = container.userModule.CreateUserUseCase;
const getUserUseCase = container.userModule.GetUserUseCase;
const createUserPresenter = container.userModule.CreateUserPresenter;

// Access todo module services
const createTodoUseCase = container.todoModule.CreateTodoUseCase;
const getTodosByUserUseCase = container.todoModule.GetTodosByUserUseCase;
const createTodoPresenter = container.todoModule.CreateTodoPresenter;
```

#### Method 2: Using inject() Function (Type-Safe)

```typescript
import { inject } from './container.gen';

// Access services with full type safety
const createUserUseCase = inject('userModule.CreateUserUseCase');
const createTodoUseCase = inject('todoModule.CreateTodoUseCase');
const getUserPresenter = inject('userModule.GetUserPresenter');
```

## Example Workflow

### User Management
```typescript
// Create user use case
const createUserUseCase = inject('userModule.CreateUserUseCase');
const createUserPresenter = inject('userModule.CreateUserPresenter');

// Execute use case
const user = await createUserUseCase.execute({
  name: 'John Doe',
  email: 'john@example.com'
});

// Present the result
const userViewModel = createUserPresenter.present(user);
console.log('Created user:', userViewModel);
```

### Todo Management with Cross-Module Validation
```typescript
// Create todo use case (validates user exists)
const createTodoUseCase = inject('todoModule.CreateTodoUseCase');
const createTodoPresenter = inject('todoModule.CreateTodoPresenter');

// Execute use case
const todo = await createTodoUseCase.execute({
  title: 'Learn Clean Architecture',
  description: 'Study the principles and patterns',
  userId: user.id
});

// Present the result
const todoViewModel = createTodoPresenter.present(todo);
console.log('Created todo:', todoViewModel);
```

### Querying Todos by User
```typescript
const getTodosByUserUseCase = inject('todoModule.GetTodosByUserUseCase');
const getTodosByUserPresenter = inject('todoModule.GetTodosByUserPresenter');

// Get todos for a specific user
const todos = await getTodosByUserUseCase.execute(user.id);

// Present the results
const todosViewModel = getTodosByUserPresenter.present(todos);
console.log('User todos:', todosViewModel);
```

## Architecture Benefits

### 1. Dependency Inversion
- High-level modules don't depend on low-level modules
- Both depend on abstractions (interfaces)
- IoC Arise handles dependency injection automatically

### 2. Single Responsibility
- Each layer has a single responsibility
- Use cases contain business logic only
- Presenters handle formatting only
- Repositories handle data access only

### 3. Open/Closed Principle
- Easy to add new use cases without modifying existing code
- Easy to change presentation logic without affecting business logic
- Easy to swap data storage implementations

### 4. Testability
- Each layer can be tested independently
- Easy to mock dependencies for unit testing
- Business logic is isolated and testable

### 5. Maintainability
- Clear separation of concerns
- Modular organization
- Cross-module dependencies are explicit and validated

## Post-Construction Initialization

```typescript
import { onInit } from './container.gen';

// The onInit function is called automatically when inject() is first used
// You can modify it in the generated container.gen.ts file for custom initialization
```

## IoC Configuration

```json
{
  "source": ".",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "verbose": true,
  "modules": {
    "UserModule": [
      "use-cases/*User*",
      "repositories/UserRepository.ts",
      "presenters/*User*"
    ],
    "TodoModule": [
      "use-cases/*Todo*", 
      "repositories/TodoRepository.ts",
      "presenters/*Todo*"
    ]
  }
}
```

This configuration:
- Uses interface pattern matching (`I[A-Z].*`)
- Groups user-related classes into `UserModule`
- Groups todo-related classes into `TodoModule`
- Automatically resolves cross-module dependencies
- Excludes test files from analysis

## Benefits of This Implementation

1. **Clean Separation**: Each layer has distinct responsibilities
2. **Testability**: Easy to unit test each component in isolation
3. **Flexibility**: Easy to change implementations without affecting other layers
4. **Type Safety**: Full TypeScript support with compile-time validation
5. **Scalability**: Easy to add new features following the same patterns
6. **Maintainability**: Clear architecture makes code easy to understand and modify
7. **Cross-Module Support**: Business domains can interact while remaining separated

Perfect for enterprise applications that need robust, maintainable, and testable architecture!