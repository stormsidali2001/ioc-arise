---
title: Examples
description: Real-world examples of using IoC Arise in different scenarios
---

## Basic Example

This example shows the simplest use case with a service and repository pattern.

### Project Structure

```
src/
├── interfaces/
│   ├── IUserRepository.ts
│   └── IUserService.ts
├── repositories/
│   └── UserRepository.ts
├── services/
│   └── UserService.ts
└── entities/
    └── User.ts
```

### Code

```typescript
// src/interfaces/IUserRepository.ts
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

// src/interfaces/IUserService.ts
export interface IUserService {
  getUser(id: string): Promise<User>;
}

// src/repositories/UserRepository.ts
import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../entities/User';

export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    // Database logic here
    return null;
  }
  
  async save(user: User): Promise<void> {
    // Save logic here
  }
}

// src/services/UserService.ts
import { IUserService } from '../interfaces/IUserService';
import { IUserRepository } from '../interfaces/IUserRepository';
import { User } from '../entities/User';

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}
  
  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }
}
```

### Configuration

```json
// src/ioc.config.json
{
  "source": ".",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": ["**/*.test.ts"]
}
```

### Generated Container

```typescript
// src/container.gen.ts (generated)
export const container = {
  userRepository: new UserRepository(),
  userService: new UserService(container.userRepository)
};

export type Container = typeof container;
```

## Clean Architecture Example

This example demonstrates IoC Arise with Clean Architecture pattern, including use cases, presenters, and multiple layers.

### Project Structure

```
src/
├── entities/
│   ├── User.ts
│   └── Todo.ts
├── ports/
│   ├── IInputPort.ts
│   └── IOutputPort.ts
├── use-cases/
│   ├── CreateUserUseCase.ts
│   ├── CreateTodoUseCase.ts
│   └── UpdateTodoUseCase.ts
├── repositories/
│   ├── IUserRepository.ts
│   └── ITodoRepository.ts
├── presenters/
│   ├── CreateUserPresenter.ts
│   └── CreateTodoPresenter.ts
└── ioc.config.json
```

### Key Classes

```typescript
// src/use-cases/CreateUserUseCase.ts
export class CreateUserUseCase implements ICreateUserInputPort {
  constructor(
    private userRepository: IUserRepository,
    private outputPort: ICreateUserOutputPort
  ) {}
  
  async execute(userData: CreateUserRequestDTO): Promise<void> {
    // Use case logic
  }
}

// src/presenters/CreateUserPresenter.ts
export class CreateUserPresenter implements ICreateUserOutputPort {
  presentSuccess(user: UserResponseDTO): void {
    console.log('User created:', user);
  }
  
  presentError(error: string): void {
    console.error('Error:', error);
  }
}
```

### Module Configuration

```json
// src/ioc.config.json
{
  "source": ".",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
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

### Generated Container with Modules

```typescript
// src/container.gen.ts (generated)
export const userModuleContainer = {
  userRepository: new UserRepository(),
  createUserPresenter: new CreateUserPresenter(),
  createUserUseCase: new CreateUserUseCase(
    userModuleContainer.userRepository,
    userModuleContainer.createUserPresenter
  )
};

export const todoModuleContainer = {
  todoRepository: new TodoRepository(),
  createTodoPresenter: new CreateTodoPresenter(),
  createTodoUseCase: new CreateTodoUseCase(
    userModuleContainer.userRepository, // Cross-module dependency
    todoModuleContainer.todoRepository,
    todoModuleContainer.createTodoPresenter
  )
};

export const container = {
  ...userModuleContainer,
  ...todoModuleContainer
};
```

## Multiple Dependencies Example

This example shows a class with multiple dependencies and complex dependency chains.

```typescript
// Complex service with multiple dependencies
export class OrderService implements IOrderService {
  constructor(
    private userRepository: IUserRepository,
    private productRepository: IProductRepository,
    private paymentService: IPaymentService,
    private emailService: IEmailService,
    private auditLogger: IAuditLogger
  ) {}
  
  async createOrder(orderData: CreateOrderData): Promise<Order> {
    // Complex business logic using all dependencies
  }
}

// Payment service with its own dependencies
export class PaymentService implements IPaymentService {
  constructor(
    private paymentGateway: IPaymentGateway,
    private fraudDetection: IFraudDetection
  ) {}
}
```

### Generated Container

```typescript
export const container = {
  // Base dependencies
  userRepository: new UserRepository(),
  productRepository: new ProductRepository(),
  paymentGateway: new PaymentGateway(),
  fraudDetection: new FraudDetection(),
  emailService: new EmailService(),
  auditLogger: new AuditLogger(),
  
  // Intermediate dependencies
  paymentService: new PaymentService(
    container.paymentGateway,
    container.fraudDetection
  ),
  
  // Complex service with all dependencies
  orderService: new OrderService(
    container.userRepository,
    container.productRepository,
    container.paymentService,
    container.emailService,
    container.auditLogger
  )
};
```

## Circular Dependencies Example

IoC Arise detects circular dependencies and provides helpful error messages.

### Problematic Code

```typescript
// This creates a circular dependency
export class ServiceA implements IServiceA {
  constructor(private serviceB: IServiceB) {}
}

export class ServiceB implements IServiceB {
  constructor(private serviceA: IServiceA) {}
}
```

### Error Output

```bash
❌ Circular dependencies detected:
   ServiceA -> ServiceB -> ServiceA

💡 Suggestions to resolve:
   1. Extract shared logic into a separate service
   2. Use events/messaging instead of direct dependencies
   3. Consider if one dependency can be injected later (setter injection)
   4. Review your architecture - circular deps often indicate design issues
```

## JSDoc Scope Detection

IoC Arise supports dependency scopes through JSDoc annotations. **By default, all dependencies are singleton-scoped unless explicitly specified otherwise.**

### Available Scopes

- **`singleton`** (default): One instance shared across the entire application
- **`transient`**: New instance created for each injection

### Using JSDoc Scope Annotations

```typescript
// Singleton (default - no annotation needed)
export class DatabaseConnection implements IDatabaseConnection {
  // Shared across the application
  connect() {
    console.log('Connecting to database...');
  }
}

/**
 * @scope transient
 */
export class Logger implements ILogger {
  // New instance for each usage
  log(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
  }
}

/**
 * @scope transient
 */
export class EmailService implements IEmailService {
  // New instance for each usage
  async sendEmail(to: string, subject: string, body: string) {
    // Email sending logic
  }
}
```

### Generated Container Behavior

The generated container handles scopes differently:

```typescript
// Generated container (simplified)
export const container = {
  // Singleton - same instance returned every time
  get IDatabaseConnection() {
    if (!this._databaseConnection) {
      this._databaseConnection = new DatabaseConnection();
    }
    return this._databaseConnection;
  },
  
  // Transient - new instance every time
  get ILogger() {
    return new Logger();
  },
  
  // Transient - new instance every time
  get IEmailService() {
    return new EmailService();
  }
};
```

### Real-World Example

```typescript
// src/services/UserService.ts
export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,  // Singleton
    private logger: ILogger,                  // Transient
    private emailService: IEmailService      // Transient
  ) {}
  
  async createUser(userData: CreateUserData) {
    this.logger.log('Creating new user');
    const user = await this.userRepository.create(userData);
    await this.emailService.sendWelcomeEmail(user.email);
    return user;
  }
}
```

**Important Notes:**
- Only `singleton` and `transient` scopes are currently supported
- JSDoc annotations must be placed directly above the class declaration
- Invalid scope values will default to `singleton`
- Scope detection happens at build time during container generation

## Integration with Express.js

Example of using IoC Arise with an Express.js application.

```typescript
// src/app.ts
import express from 'express';
import { container } from './container.gen';

const app = express();

// Use container in routes
app.get('/users/:id', async (req, res) => {
  try {
    const user = await container.userService.getUser(req.params.id);
    res.json(user);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.post('/users', async (req, res) => {
  try {
    await container.createUserUseCase.execute(req.body);
    const result = container.createUserPresenter.getResult();
    
    if (result.success) {
      res.status(201).json(result.user);
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## Testing with Generated Container

Example of how to test code that uses the generated container.

```typescript
// tests/UserService.test.ts
import { UserService } from '../src/services/UserService';
import { IUserRepository } from '../src/interfaces/IUserRepository';

// Mock implementation
class MockUserRepository implements IUserRepository {
  async findById(id: string) {
    return { id, name: 'Test User', email: 'test@example.com' };
  }
  
  async save(user: any) {
    // Mock save
  }
}

describe('UserService', () => {
  it('should get user by id', async () => {
    const mockRepo = new MockUserRepository();
    const userService = new UserService(mockRepo);
    
    const user = await userService.getUser('123');
    expect(user.id).toBe('123');
  });
});
```

## Next Steps

- Learn about [Module Organization](/guides/modules/) for complex projects
- Explore [Best Practices](/guides/best-practices/) for optimal usage
- Check the [Configuration Reference](/reference/configuration/) for all options