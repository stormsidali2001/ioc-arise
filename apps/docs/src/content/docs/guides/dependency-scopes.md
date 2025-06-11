---
title: Dependency Scopes
description: Understanding singleton and transient dependency scopes in IoC Arise
---

# Dependency Scopes

IoC Arise supports two dependency scopes that control how instances are created and managed in your application. Understanding these scopes is crucial for proper memory management and application behavior.

## Overview

| Scope | Behavior | Use Cases |
|-------|----------|----------|
| **Singleton** | One instance shared across the application | Database connections, configuration services, caches |
| **Transient** | New instance created for each injection | Loggers, event handlers, stateless services |

## Singleton Scope (Default)

**Singleton** is the default scope for all dependencies. A single instance is created and shared across the entire application lifecycle.

### Characteristics

- ✅ **Memory efficient**: Only one instance exists
- ✅ **State preservation**: Maintains state across the application
- ✅ **Performance**: No instantiation overhead after first creation
- ⚠️ **Thread safety**: Shared state requires careful consideration
- ⚠️ **Testing**: Shared state can affect test isolation

### Example

```typescript
// No annotation needed - singleton is default
export class DatabaseConnection implements IDatabaseConnection {
  private isConnected = false;
  
  connect() {
    if (!this.isConnected) {
      console.log('Establishing database connection...');
      this.isConnected = true;
    }
    return this.isConnected;
  }
  
  disconnect() {
    this.isConnected = false;
    console.log('Database connection closed');
  }
}

export class ConfigService implements IConfigService {
  private config: Record<string, any> = {};
  
  constructor() {
    // Load configuration once
    this.config = this.loadConfiguration();
  }
  
  get(key: string): any {
    return this.config[key];
  }
  
  private loadConfiguration() {
    // Expensive operation - only done once
    return { apiUrl: 'https://api.example.com', timeout: 5000 };
  }
}
```

### Generated Container Behavior

```typescript
// Generated container for singleton dependencies
export const container = {
  get IDatabaseConnection() {
    if (!this._databaseConnection) {
      this._databaseConnection = new DatabaseConnection();
    }
    return this._databaseConnection; // Same instance every time
  },
  
  get IConfigService() {
    if (!this._configService) {
      this._configService = new ConfigService();
    }
    return this._configService; // Same instance every time
  }
};
```

## Transient Scope

**Transient** dependencies create a new instance every time they are requested. Use the `@scope transient` JSDoc annotation to specify this behavior.

### Characteristics

- ✅ **Isolation**: Each usage gets a fresh instance
- ✅ **No shared state**: Eliminates state-related bugs
- ✅ **Testing friendly**: Clean state for each test
- ⚠️ **Memory usage**: Multiple instances consume more memory
- ⚠️ **Performance**: Instantiation overhead on each request

### Example

```typescript
/**
 * @scope transient
 */
export class Logger implements ILogger {
  private context: string;
  
  constructor() {
    this.context = `Logger-${Date.now()}-${Math.random()}`;
  }
  
  log(message: string) {
    console.log(`[${this.context}] ${new Date().toISOString()}: ${message}`);
  }
  
  error(message: string, error?: Error) {
    console.error(`[${this.context}] ERROR: ${message}`, error);
  }
}

/**
 * @scope transient
 */
export class EventHandler implements IEventHandler {
  private handlerId: string;
  
  constructor() {
    this.handlerId = `handler-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  handle(event: Event) {
    console.log(`Handler ${this.handlerId} processing event:`, event.type);
    // Process event without affecting other handlers
  }
}
```

### Generated Container Behavior

```typescript
// Generated container for transient dependencies
export const container = {
  get ILogger() {
    return new Logger(); // New instance every time
  },
  
  get IEventHandler() {
    return new EventHandler(); // New instance every time
  }
};
```

## Mixed Scope Example

Real applications typically use both scopes depending on the service's purpose:

```typescript
// Singleton - shared database connection
export class UserRepository implements IUserRepository {
  constructor(private db: IDatabaseConnection) {} // Singleton
  
  async findById(id: string): Promise<User | null> {
    // Use shared database connection
    return this.db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

// Singleton - business logic service
export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository, // Singleton
    private logger: ILogger,                 // Transient
    private eventHandler: IEventHandler     // Transient
  ) {}
  
  async createUser(userData: CreateUserData): Promise<User> {
    // Each operation gets fresh logger and event handler
    this.logger.log('Creating new user');
    
    const user = await this.userRepository.create(userData);
    
    this.eventHandler.handle({
      type: 'user.created',
      data: { userId: user.id }
    });
    
    return user;
  }
}
```

## Best Practices

### Use Singleton For:

- **Database connections and pools**
- **Configuration services**
- **Caches and shared state**
- **Expensive-to-create services**
- **Services that coordinate global state**

```typescript
// Good singleton candidates
export class DatabasePool implements IDatabasePool {}
export class CacheService implements ICacheService {}
export class ConfigurationManager implements IConfigurationManager {}
```

### Use Transient For:

- **Loggers with contextual information**
- **Event handlers and processors**
- **Stateless utility services**
- **Services that should not share state**
- **Services used in parallel processing**

```typescript
/**
 * @scope transient
 */
export class RequestLogger implements IRequestLogger {}

/**
 * @scope transient
 */
export class EmailSender implements IEmailSender {}

/**
 * @scope transient
 */
export class DataProcessor implements IDataProcessor {}
```

## Performance Considerations

### Singleton Performance

```typescript
// ✅ Good: Expensive initialization done once
export class HeavyService implements IHeavyService {
  private expensiveResource: any;
  
  constructor() {
    // This expensive operation happens only once
    this.expensiveResource = this.initializeExpensiveResource();
  }
}
```

### Transient Performance

```typescript
/**
 * @scope transient
 */
export class LightweightService implements ILightweightService {
  // ✅ Good: Lightweight, fast to create
  constructor() {
    // Minimal initialization
  }
  
  process(data: any) {
    // Stateless processing
    return data.map(item => item.toUpperCase());
  }
}
```

## Testing Implications

### Singleton Testing Challenges

```typescript
// ⚠️ Singleton state can leak between tests
describe('UserService', () => {
  it('should handle user creation', () => {
    const userService = container.IUserService;
    // State from previous tests might affect this test
  });
});
```

### Transient Testing Benefits

```typescript
/**
 * @scope transient
 */
export class TestableService implements ITestableService {
  // ✅ Fresh instance for each test
}

describe('TestableService', () => {
  it('should start with clean state', () => {
    const service = container.ITestableService; // Fresh instance
    // No state contamination from other tests
  });
});
```

## Common Pitfalls

### Avoid These Patterns

```typescript
// ❌ Bad: Transient service with expensive initialization
/**
 * @scope transient
 */
export class ExpensiveService implements IExpensiveService {
  constructor() {
    // This expensive operation happens on every injection!
    this.loadLargeDataset();
  }
}

// ❌ Bad: Singleton service with request-specific state
export class RequestProcessor implements IRequestProcessor {
  private currentRequest: Request; // This will be shared!
  
  process(request: Request) {
    this.currentRequest = request; // Race condition!
  }
}
```

### Better Approaches

```typescript
// ✅ Good: Expensive service as singleton
export class ExpensiveService implements IExpensiveService {
  constructor() {
    this.loadLargeDataset(); // Only once
  }
}

// ✅ Good: Request processor as transient
/**
 * @scope transient
 */
export class RequestProcessor implements IRequestProcessor {
  process(request: Request) {
    // No shared state, safe for concurrent use
  }
}
```

## Summary

Choosing the right scope is essential for building robust applications:

- **Default to singleton** for services that benefit from shared state and expensive initialization
- **Use transient** for services that need isolation or are used in concurrent scenarios
- **Consider performance** implications of your choice
- **Think about testing** and how scope affects test isolation
- **Avoid shared mutable state** in singleton services when possible

The scope you choose should align with your service's purpose and usage patterns in your application architecture.