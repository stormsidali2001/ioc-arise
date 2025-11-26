# Minimal Todo List Example

This example demonstrates a simple todo list application using IoC Arise with:

- Repository pattern with in-memory implementation
- Service layer for business logic  
- Simple entity model
- Interface-based dependency injection

## Structure

```
minimal-todo/
├── entities/
│   └── Todo.ts                    # Todo entity class with business logic
├── repositories/
│   ├── ITodoRepository.ts         # Repository interface
│   └── InMemoryTodoRepository.ts  # In-memory repository implementation
├── services/
│   ├── ITodoService.ts            # Service interface  
│   └── TodoService.ts             # Service implementation
├── container.gen.ts               # Generated IoC container
├── ioc.config.json               # IoC configuration
└── README.md                      # This file
```

## Key Features

### 1. Interface-Based Design
- Services and repositories are defined as interfaces first
- Implementations are separated from contracts
- Easy to swap implementations for testing or different environments

### 2. Repository Pattern
- `ITodoRepository` interface defines data access contract
- `InMemoryTodoRepository` provides simple in-memory storage
- Can easily add database implementations later

### 3. Service Layer
- `ITodoService` encapsulates business logic
- Validation and business rules are centralized
- Depends on repository through interface

### 4. Type-Safe Dependency Injection
- Container provides full TypeScript support
- Interface names are used as service keys
- Two access patterns: direct container and `inject()` function

## Usage

### Running the Example

1. Generate the container:
   ```bash
   npx ioc-arise generate
   ```

2. Use the container in your application:

#### Method 1: Direct Container Access

```typescript
import { container } from './container.gen';

const todoService = container.coreModule.ITodoService;
const todoRepository = container.coreModule.ITodoRepository;

// Create a new todo
await todoService.createTodo({ 
  title: 'Learn IoC Arise', 
  description: 'Study dependency injection' 
});

// Get all todos
const todos = await todoService.getAllTodos();
console.log('All todos:', todos);
```

#### Method 2: Using inject() Function (Type-Safe)

```typescript
import { inject } from './container.gen';

// Access services with full type safety
const todoService = inject('coreModule.ITodoService');
const todoRepository = inject('coreModule.ITodoRepository');

// Create todos
await todoService.createTodo({
  title: 'Buy groceries',
  description: 'Milk, bread, eggs'
});

await todoService.createTodo({
  title: 'Walk the dog',
  description: 'Take Rex for a 30-minute walk'
});

// Update a todo
const todos = await todoService.getAllTodos();
if (todos.length > 0) {
  await todoService.updateTodo(todos[0].id, {
    title: 'Buy groceries - DONE',
    description: 'Completed shopping',
    completed: true
  });
}

// Delete a todo
if (todos.length > 1) {
  await todoService.deleteTodo(todos[1].id);
}
```

### Example Todo Operations

```typescript
// Create a todo
const todo = await todoService.createTodo({
  title: 'Complete project',
  description: 'Finish the IoC Arise integration'
});

// Mark as completed
await todoService.markAsCompleted(todo.id);

// Get completed todos only
const completedTodos = await todoService.getCompletedTodos();

// Get pending todos only  
const pendingTodos = await todoService.getPendingTodos();

// Update todo details
await todoService.updateTodo(todo.id, {
  title: 'Complete project - Phase 1',
  description: 'Finish the IoC Arise integration and testing'
});

// Delete when no longer needed
await todoService.deleteTodo(todo.id);
```

## Post-Construction Initialization

The generated container includes an `onInit()` function for custom initialization:

```typescript
import { onInit } from './container.gen';

// The onInit function is called automatically when inject() is first used
// You can modify it in the generated container.gen.ts file for custom setup
```

## Todo Entity

The `Todo` class includes built-in business logic:

```typescript
export class Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: CreateTodoData) {
    this.id = Math.random().toString(36).substr(2, 9);
    this.title = data.title;
    this.description = data.description;
    this.completed = false;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  // Business logic methods
  markAsCompleted(): void { /* ... */ }
  markAsPending(): void { /* ... */ }
  update(data: UpdateTodoData): void { /* ... */ }
  // ... more methods
}
```

## Repository Interface

```typescript
export interface ITodoRepository {
  create(todo: Todo): Promise<Todo>;
  findById(id: string): Promise<Todo | undefined>;
  findAll(): Promise<Todo[]>;
  update(id: string, data: UpdateTodoData): Promise<Todo | undefined>;
  delete(id: string): Promise<boolean>;
  findByCompleted(completed: boolean): Promise<Todo[]>;
}
```

## Service Interface

```typescript
export interface ITodoService {
  createTodo(data: CreateTodoData): Promise<Todo>;
  getAllTodos(): Promise<Todo[]>;
  getTodoById(id: string): Promise<Todo | undefined>;
  updateTodo(id: string, data: UpdateTodoData): Promise<Todo | undefined>;
  deleteTodo(id: string): Promise<boolean>;
  markAsCompleted(id: string): Promise<Todo | undefined>;
  markAsPending(id: string): Promise<Todo | undefined>;
  getCompletedTodos(): Promise<Todo[]>;
  getPendingTodos(): Promise<Todo[]>;
}
```

## IoC Configuration

The `ioc.config.json` file is minimal for this simple example:

```json
{
  "source": ".",
  "output": "container.gen.ts"
}
```

This configuration:
- Scans the current directory for classes and interfaces
- Generates a single container with all services in `coreModule`
- Uses interface names as service keys (`ITodoService`, `ITodoRepository`)
- Automatically resolves dependencies based on constructor parameters

## Benefits

1. **Simplicity**: Easy to understand and extend
2. **Type Safety**: Full TypeScript support with interface contracts
3. **Testability**: Easy to mock repositories and services
4. **Flexibility**: Can easily add new implementations (database, file storage, etc.)
5. **Clean Architecture**: Clear separation between entities, repositories, and services