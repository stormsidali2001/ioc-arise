# Lazy Loading Implementation Plan

## Overview

Implement lazy injection support with JSDoc-based scope detection while maintaining type safety and the current container structure. Singletons will be eagerly instantiated, while transient and request-scoped dependencies will be lazily loaded.

## Requirements Analysis

### Current Container Structure (to preserve)
```typescript
// Current generated container maintains:
// 1. Direct property access with type safety
// 2. Interface-based property names
// 3. Simple object export pattern

const createUserPresenter = new CreateUserPresenter();
const deleteUserPresenter = new DeleteUserPresenter();
const getUserPresenter = new GetUserPresenter();
const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository, createUserPresenter);
const deleteUserUseCase = new DeleteUserUseCase(userRepository, deleteUserPresenter);
const getUserUseCase = new GetUserUseCase(userRepository, getUserPresenter);
o
export const container = {
  ICreateUserOutputPort: createUserPresenter,
  IDeleteUserOutputPort: deleteUserPresenter,
  IGetUserOutputPort: getUserPresenter,
  IUserRepository: userRepository,
  ICreateUserInputPort: createUserUseCase,
  IDeleteUserInputPort: deleteUserUseCase,
  IGetUserInputPort: getUserUseCase,
};

export type Container = typeof container;
```

### Scope Behavior Requirements

1. **Singleton (default)**: Eagerly instantiated at container creation
2. **Transient**: Lazily instantiated, new instance on each access
3. **Request**: Lazily instantiated, one instance per request context

## Implementation Strategy

### 1. JSDoc Scope Detection

**Analyzer Enhancement:**
```typescript
/**
 * @scope transient
 */
class TempFileHandler implements ITempFileHandler {
  // Will be lazily loaded, new instance each time
}

/**
 * @scope request
 */
class RequestLogger implements IRequestLogger {
  // Will be lazily loaded, one per request
}

// No annotation = singleton (eager loading)
class UserRepository implements IUserRepository {
  // Eagerly instantiated
}
```

**Detection Logic:**
```typescript
private extractScopeFromJSDoc(classNode: any): InjectionScope {
  const leadingComments = this.getLeadingComments(classNode);
  const scopeMatch = leadingComments.match(/@scope\s+(singleton|transient|request)/);
  return scopeMatch ? scopeMatch[1] as InjectionScope : 'singleton';
}
```

### 2. Mixed Generation Strategy

**Container Generation Approach:**
- **Singletons**: Generate direct instantiation (current behavior)
- **Transient/Request**: Generate getter functions with lazy loading

**Generated Container Structure:**
```typescript
// Eager singleton instantiation
const userRepository = new UserRepository();
const createUserPresenter = new CreateUserPresenter();

// Lazy loading functions for non-singletons
const transientInstances = new Map<string, () => any>();
const requestInstances = new Map<string, any>();

// Setup transient factories
transientInstances.set('tempFileHandler', () => new TempFileHandler());

// Container object with mixed access patterns
export const container = {
  // Singleton properties (direct access)
  IUserRepository: userRepository,
  ICreateUserOutputPort: createUserPresenter,
  
  // Transient properties (getter functions)
  get ITempFileHandler() {
    return transientInstances.get('tempFileHandler')!();
  },
  
  // Request properties (context-aware getters)
  get IRequestLogger() {
    return getRequestScoped('requestLogger', () => new RequestLogger());
  }
};
```

### 3. Type Safety Preservation

**Maintain Current Type Structure:**
```typescript
// Generated types remain the same
export type Container = {
  IUserRepository: UserRepository;
  ICreateUserOutputPort: CreateUserPresenter;
  ITempFileHandler: TempFileHandler;
  IRequestLogger: RequestLogger;
};

// Usage remains identical
const userRepo = container.IUserRepository; // Singleton
const tempHandler = container.ITempFileHandler; // New instance
const logger = container.IRequestLogger; // Request-scoped
```


### 5. Generated Container Example

```typescript
// container.gen.ts output
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { UserRepository } from './repositories/UserRepository';
import { TempFileHandler } from './utils/TempFileHandler';
import { RequestLogger } from './logging/RequestLogger';

// Eager singleton instantiation
const userRepository = new UserRepository();
const getUserUseCase = new GetUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);

// Lazy loading setup
const transientFactories = new Map([
  ['tempFileHandler', () => new TempFileHandler()],
]);

const requestFactories = new Map([
  ['requestLogger', () => new RequestLogger()],
]);

// Request scope management
let currentRequestId = 'default';
const requestInstances = new Map<string, any>();

function getRequestScoped<T>(key: string): T {
  const requestKey = `${currentRequestId}:${key}`;
  if (!requestInstances.has(requestKey)) {
    requestInstances.set(requestKey, requestFactories.get(key)!());
  }
  return requestInstances.get(requestKey);
}

// Mixed container object
export const container = {
  IUserRepository: userRepository,
  IGetUserInputPort: getUserUseCase,
  IDeleteUserInputPort: deleteUserUseCase,
  
  get ITempFileHandler() {
    return transientFactories.get('tempFileHandler')!();
  },
  
  get IRequestLogger() {
    return getRequestScoped('requestLogger');
  },
  
  // Request management utilities
  setRequestContext(requestId: string): void {
    currentRequestId = requestId;
  },
  
  clearRequestScope(requestId?: string): void {
    if (requestId) {
      const keysToDelete = Array.from(requestInstances.keys())
        .filter(key => key.startsWith(`${requestId}:`));
      keysToDelete.forEach(key => requestInstances.delete(key));
    } else {
      requestInstances.clear();
    }
  }
};

export type Container = typeof container;
```

### 6. Usage Examples

```typescript
// Singleton usage (unchanged)
const userRepo = container.IUserRepository; // Same instance always

// Transient usage (new instance each time)
const handler1 = container.ITempFileHandler; // New instance
const handler2 = container.ITempFileHandler; // Different instance

// Request-scoped usage
container.setRequestContext('request-123');
const logger1 = container.IRequestLogger; // New instance for this request
const logger2 = container.IRequestLogger; // Same instance within request

container.setRequestContext('request-456');
const logger3 = container.IRequestLogger; // New instance for different request

// Cleanup
container.clearRequestScope('request-123');
```

### 7. Testing Strategy

1. **Type Safety**: Ensure `container.IServiceName` maintains correct types
2. **Singleton Behavior**: Verify same instance returned for singletons
3. **Transient Behavior**: Verify new instances for transients
4. **Request Behavior**: Verify request isolation
5. **Dependency Resolution**: Ensure lazy dependencies resolve correctly

### 8. Migration Path

1. **Phase 1**: Implement JSDoc parsing in analyzer
2. **Phase 2**: Modify generator for mixed instantiation
3. **Phase 3**: Add request scope management
4. **Phase 4**: Update CLI with scope options
5. **Phase 5**: Add comprehensive testing

### 9. Benefits

- **Performance**: Singletons are pre-instantiated for fast access
- **Memory Efficiency**: Transients don't accumulate
- **Request Isolation**: Request-scoped dependencies are properly isolated
- **Type Safety**: Full TypeScript support maintained
- **Backward Compatibility**: Existing usage patterns unchanged
- **No Runtime Reflection**: All dependency resolution at compile time

### 10. Considerations

- **Circular Dependencies**: Need to handle lazy loading in dependency chains
- **Error Handling**: Proper error messages for missing dependencies
- **Performance**: Getter functions have slight overhead vs direct property access
- **Type Safety**: All properties maintain strict typing with explicit return type annotations
This plan maintains the current type-safe container structure while adding sophisticated dependency lifecycle management through JSDoc annotations and mixed instantiation strategies. **Full type safety is preserved through explicit return type annotations on all getter functions.**s
- **Request Context**: May need integration with web framework