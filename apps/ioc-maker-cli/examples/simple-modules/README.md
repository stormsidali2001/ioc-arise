# Simple Modules Example

This example demonstrates IoC Arise's **module system** with two separate modules that have cross-module dependencies.

## Overview

This example showcases modular architecture with:
- **UserModule**: User management functionality
- **TodoModule**: Todo management with user validation

## Structure

```
simple-modules/
├── user/
│   ├── User.ts                  # User entity
│   ├── IUserRepository.ts       # User repository interface
│   ├── UserRepository.ts        # User repository implementation
│   ├── IUserService.ts          # User service interface
│   └── UserService.ts           # User service implementation
├── todo/
│   ├── Todo.ts                  # Todo entity
│   ├── ITodoRepository.ts       # Todo repository interface
│   ├── TodoRepository.ts        # Todo repository implementation
│   ├── ITodoService.ts          # Todo service interface
│   └── TodoService.ts           # Todo service implementation (cross-module dependency)
├── UserModule.gen.ts            # Generated user module container
├── TodoModule.gen.ts            # Generated todo module container
├── container.gen.ts             # Main container aggregating modules
├── demo.ts                      # Demonstration of module interaction
├── ioc.config.json             # IoC configuration with module definitions
└── README.md                    # This file
```

## Key Features

### 1. Module Organization
Each module encapsulates related functionality:

**UserModule:**
- `User` entity with user data
- `IUserRepository` & `UserRepository` for data access
- `IUserService` & `UserService` for business logic

**TodoModule:**
- `Todo` entity with todo data
- `ITodoRepository` & `TodoRepository` for data access  
- `ITodoService` & `TodoService` for business logic

### 2. Cross-Module Dependencies
The TodoService demonstrates cross-module dependency by depending on UserRepository:

```typescript
export class TodoService implements ITodoService {
  constructor(
    private todoRepository: ITodoRepository,     // Same module (TodoModule)
    private userRepository: IUserRepository      // Different module (UserModule)!
  ) {}

  async createTodo(title: string, userId: string): Promise<Todo> {
    // Validate user exists using cross-module dependency
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }
    // Create todo logic...
  }
}
```

### 3. Automatic Dependency Resolution
IoC Arise automatically:
- Discovers dependencies across modules
- Creates proper module instantiation order
- Wires everything together in a unified container

## Usage

### Running the Demo

```bash
# Generate the container
npx ioc-arise generate

# Run the demonstration
npx ts-node demo.ts
```

### Using the Container

#### Method 1: Direct Container Access

```typescript
import { container } from './container.gen';

// Access user module services
const userService = container.userModule.IUserService;
const userRepository = container.userModule.IUserRepository;

// Access todo module services
const todoService = container.todoModule.ITodoService;
const todoRepository = container.todoModule.ITodoRepository;

// Use services
const users = await userService.getAllUsers();
const userTodos = await todoService.getTodosByUser('1');
```

#### Method 2: Using inject() Function (Type-Safe)

```typescript
import { inject } from './container.gen';

// Access services with full type safety and module paths
const userService = inject('userModule.IUserService');
const todoService = inject('todoModule.ITodoService');

// Create a new todo (with user validation)
const newTodo = await todoService.createTodo('Learn IoC Arise', '1');

// Get all users
const users = await userService.getAllUsers();
```

## Example Workflow

```typescript
// 1. Get all users
const users = await userService.getAllUsers();
console.log('Available users:', users);

// 2. Create a todo for a specific user
const newTodo = await todoService.createTodo('Complete project', '1');
console.log('Created todo:', newTodo);

// 3. Get todos for that user
const userTodos = await todoService.getTodosByUser('1');
console.log('User todos:', userTodos);

// 4. Update todo status
const updatedTodo = await todoService.updateTodo(newTodo.id, undefined, true);
console.log('Updated todo:', updatedTodo);

// 5. Try to create todo for non-existent user (will throw error)
try {
  await todoService.createTodo('Invalid todo', 'non-existent-user');
} catch (error) {
  console.log('Expected error:', error.message);
}
```

## Entity Definitions

### User Entity
```typescript
export class User {
  constructor(
    public id: string,
    public name: string,
    public email: string
  ) {}
}
```

### Todo Entity  
```typescript
export class Todo {
  constructor(
    public id: string,
    public title: string,
    public userId: string,
    public completed: boolean = false
  ) {}
}
```

## Service Interfaces

### IUserService
```typescript
export interface IUserService {
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  createUser(name: string, email: string): Promise<User>;
  updateUser(id: string, name?: string, email?: string): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
}
```

### ITodoService
```typescript
export interface ITodoService {
  getAllTodos(): Promise<Todo[]>;
  getTodoById(id: string): Promise<Todo | undefined>;
  getTodosByUser(userId: string): Promise<Todo[]>;
  createTodo(title: string, userId: string): Promise<Todo>;
  updateTodo(id: string, title?: string, completed?: boolean): Promise<Todo | undefined>;
  deleteTodo(id: string): Promise<boolean>;
}
```

## Post-Construction Initialization

The generated container includes an `onInit()` function for custom setup:

```typescript
import { onInit } from './container.gen';

// The onInit function is called automatically when inject() is first used
// You can modify it in the generated container.gen.ts file for custom initialization
```

## IoC Configuration

The `ioc.config.json` defines modules and their patterns:

```json
{
  "source": ".",
  "output": "container.gen.ts",
  "modules": {
    "UserModule": [
      "user/**/*"
    ],
    "TodoModule": [
      "todo/**/*"
    ]
  }
}
```

This configuration:
- Groups files in `user/` directory into `UserModule`
- Groups files in `todo/` directory into `TodoModule`
- Automatically resolves cross-module dependencies
- Generates separate module containers with proper dependency injection order

## Module Generation

IoC Arise generates:
1. **UserModule.gen.ts** - Contains user module container factory
2. **TodoModule.gen.ts** - Contains todo module container factory with cross-module dependencies
3. **container.gen.ts** - Aggregates modules and provides unified access

## Benefits

1. **Modular Organization**: Keep related code together in logical modules
2. **Cross-Module Dependencies**: Services can safely depend on other modules
3. **Type Safety**: Full TypeScript support across module boundaries
4. **Testability**: Easy to mock entire modules or individual services
5. **Scalability**: Add new modules without affecting existing ones
6. **Clean Architecture**: Clear separation of concerns between domains
7. **Dependency Validation**: Automatic validation of cross-module dependencies

Perfect for applications that need clean separation of concerns while maintaining the ability to share functionality across domains!