---
title: Best Practices
description: Learn the best practices for using IoC Arise effectively in your TypeScript projects
---

## Code Organization

### Interface Naming Conventions

Use consistent naming patterns for interfaces to make pattern matching effective:

```typescript
// ✅ Good: Consistent 'I' prefix
export interface IUserService { }
export interface IUserRepository { }
export interface IEmailService { }

// ✅ Good: Consistent suffix pattern
export interface UserServiceInterface { }
export interface UserRepositoryInterface { }

// ❌ Avoid: Inconsistent naming
export interface UserService { }      // No pattern
export interface IEmailSvc { }        // Abbreviated
export interface RepositoryUser { }   // Different order
```

### File Structure

Organize your files in a way that makes pattern matching intuitive:

```
src/
├── interfaces/           # All interfaces in one place
│   ├── IUserService.ts
│   ├── IUserRepository.ts
│   └── IEmailService.ts
├── services/            # Implementations grouped by type
│   ├── UserService.ts
│   └── EmailService.ts
├── repositories/
│   └── UserRepository.ts
└── entities/
    └── User.ts
```

Alternatively, organize by feature:

```
src/
├── user/
│   ├── interfaces/
│   │   ├── IUserService.ts
│   │   └── IUserRepository.ts
│   ├── UserService.ts
│   └── UserRepository.ts
└── email/
    ├── interfaces/
    │   └── IEmailService.ts
    └── EmailService.ts
```

## Dependency Design

### Constructor Injection

Always use constructor injection for dependencies:

```typescript
// ✅ Good: Constructor injection
export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private emailService: IEmailService
  ) {}
}

// ❌ Avoid: Property injection (not supported)
export class UserService implements IUserService {
  @Inject() private userRepository: IUserRepository;
}

// ❌ Avoid: Method injection (not supported)
export class UserService implements IUserService {
  setUserRepository(repo: IUserRepository) {
    this.userRepository = repo;
  }
}
```

### Dependency Interfaces

Always depend on interfaces, not concrete classes:

```typescript
// ✅ Good: Depends on interface
export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}
}

// ❌ Avoid: Depends on concrete class
export class UserService implements IUserService {
  constructor(private userRepository: UserRepository) {}
}
```

### Avoid Circular Dependencies

Design your dependencies to avoid cycles:

```typescript
// ❌ Avoid: Circular dependency
export class UserService {
  constructor(private orderService: IOrderService) {}
}

export class OrderService {
  constructor(private userService: IUserService) {}
}

// ✅ Good: Extract shared logic
export class UserService {
  constructor(private userRepository: IUserRepository) {}
}

export class OrderService {
  constructor(
    private orderRepository: IOrderRepository,
    private userRepository: IUserRepository  // Shared dependency
  ) {}
}

// ✅ Good: Use events for loose coupling
export class UserService {
  constructor(private eventBus: IEventBus) {}
  
  async createUser(userData: CreateUserData) {
    const user = await this.userRepository.save(userData);
    this.eventBus.publish(new UserCreatedEvent(user));
  }
}

export class OrderService {
  constructor(private eventBus: IEventBus) {
    this.eventBus.subscribe(UserCreatedEvent, this.handleUserCreated);
  }
}
```

## Configuration Management

### Use Configuration Files

Prefer configuration files over CLI arguments for consistency:

```json
// ✅ Good: ioc.config.json
{
  "source": "src",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.d.ts"
  ],
  "verbose": true
}
```

### Environment-Specific Configurations

Create different configurations for different environments:

```json
// ioc.config.development.json
{
  "source": "src",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "verbose": true,
  "modules": {
    "DevModule": ["dev-tools/**/*"]
  }
}

// ioc.config.production.json
{
  "source": "src",
  "output": "dist/container.gen.js",
  "interface": "I[A-Z].*",
  "verbose": false,
  "exclude": ["dev-tools/**/*"]
}
```

### Version Control

Include configuration files in version control, exclude generated files:

```gitignore
# .gitignore

# Include configuration
# ioc.config.json

# Exclude generated files
container.gen.ts
*.gen.ts
```

## Module Organization

### Logical Module Boundaries

Organize modules by business domains or architectural layers:

```json
// ✅ Good: Domain-based modules
{
  "modules": {
    "UserDomain": ["user/**/*", "**/*User*"],
    "OrderDomain": ["order/**/*", "**/*Order*"],
    "PaymentDomain": ["payment/**/*", "**/*Payment*"]
  }
}

// ✅ Good: Layer-based modules
{
  "modules": {
    "DomainLayer": ["entities/**/*", "value-objects/**/*"],
    "ApplicationLayer": ["use-cases/**/*", "services/**/*"],
    "InfrastructureLayer": ["repositories/**/*", "adapters/**/*"]
  }
}

// ❌ Avoid: Random groupings
{
  "modules": {
    "Module1": ["UserService.ts", "EmailRepository.ts"],
    "Module2": ["OrderService.ts", "UserRepository.ts"]
  }
}
```

### Module Size

Keep modules reasonably sized:

```json
// ✅ Good: Focused modules (5-15 classes)
{
  "modules": {
    "UserModule": [
      "use-cases/*User*",
      "repositories/UserRepository.ts",
      "services/UserService.ts"
    ]
  }
}

// ❌ Avoid: Too large (50+ classes)
{
  "modules": {
    "EverythingModule": ["**/*"]
  }
}

// ❌ Avoid: Too small (1-2 classes)
{
  "modules": {
    "UserServiceModule": ["services/UserService.ts"],
    "UserRepositoryModule": ["repositories/UserRepository.ts"]
  }
}
```

## Build Integration

### NPM Scripts

Integrate IoC Arise into your build process:

```json
// package.json
{
  "scripts": {
    "prebuild": "ioc-arise generate",
    "build": "tsc",
    "dev": "ioc-arise generate && ts-node src/index.ts",
    "test": "ioc-arise generate && jest",
    "lint:ioc": "ioc-arise analyze --check-cycles"
  }
}
```

### CI/CD Integration

Include IoC Arise in your CI/CD pipeline:

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Check IoC configuration
        run: pnpm ioc-arise analyze --check-cycles
      
      - name: Generate container
        run: pnpm ioc-arise generate
      
      - name: Run tests
        run: pnpm test
```

## Testing Strategies

### Mock Dependencies

Create mock implementations for testing:

```typescript
// tests/mocks/MockUserRepository.ts
export class MockUserRepository implements IUserRepository {
  private users: User[] = [];
  
  async findById(id: string): Promise<User | null> {
    return this.users.find(u => u.id === id) || null;
  }
  
  async save(user: User): Promise<void> {
    this.users.push(user);
  }
}

// tests/UserService.test.ts
describe('UserService', () => {
  let userService: UserService;
  let mockRepository: MockUserRepository;
  
  beforeEach(() => {
    mockRepository = new MockUserRepository();
    userService = new UserService(mockRepository);
  });
  
  it('should create user', async () => {
    const userData = { name: 'John', email: 'john@example.com' };
    await userService.createUser(userData);
    
    const user = await mockRepository.findById('1');
    expect(user?.name).toBe('John');
  });
});
```

### Test Container Generation

Test that your container generates correctly:

```typescript
// tests/container.test.ts
import { container } from '../src/container.gen';

describe('Generated Container', () => {
  it('should have all required services', () => {
    expect(container.userService).toBeDefined();
    expect(container.userRepository).toBeDefined();
    expect(container.emailService).toBeDefined();
  });
  
  it('should have correct dependency injection', () => {
    expect(container.userService).toBeInstanceOf(UserService);
    expect(container.userRepository).toBeInstanceOf(UserRepository);
  });
});
```

## Performance Optimization

### Exclude Unnecessary Files

Exclude files that don't contain dependencies:

```json
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.d.ts",
    "**/migrations/**",
    "**/seeds/**",
    "**/fixtures/**",
    "**/mocks/**"
  ]
}
```

### Use Specific Interface Patterns

Use specific patterns to reduce analysis time:

```json
// ✅ Good: Specific pattern
{
  "interface": "I[A-Z][a-zA-Z]*Service|I[A-Z][a-zA-Z]*Repository"
}

// ❌ Avoid: Too broad
{
  "interface": ".*"
}
```

### Optimize Module Patterns

Use efficient glob patterns:

```json
// ✅ Good: Specific patterns
{
  "modules": {
    "UserModule": [
      "user/UserService.ts",
      "user/UserRepository.ts"
    ]
  }
}

// ❌ Avoid: Overly broad patterns
{
  "modules": {
    "UserModule": ["**/*"]
  }
}
```

## Error Handling

### Handle Generation Errors

Plan for container generation failures:

```typescript
// src/container-loader.ts
import { existsSync } from 'fs';

let container: any;

try {
  if (existsSync('./container.gen.ts')) {
    container = require('./container.gen').container;
  } else {
    console.warn('Generated container not found, using fallback');
    container = createFallbackContainer();
  }
} catch (error) {
  console.error('Failed to load container:', error);
  container = createFallbackContainer();
}

export { container };

function createFallbackContainer() {
  return {
    userRepository: new UserRepository(),
    userService: new UserService(/* manual wiring */)
  };
}
```

### Validate Dependencies

Add runtime validation for critical dependencies:

```typescript
// src/container-validator.ts
export function validateContainer(container: any) {
  const required = ['userService', 'userRepository', 'emailService'];
  
  for (const service of required) {
    if (!container[service]) {
      throw new Error(`Required service '${service}' not found in container`);
    }
  }
}

// src/app.ts
import { container } from './container.gen';
import { validateContainer } from './container-validator';

validateContainer(container);
// Now safe to use container
```

## Monitoring and Debugging

### Enable Verbose Logging

Use verbose mode during development:

```json
{
  "verbose": true
}
```

### Regular Dependency Analysis

Regularly analyze your dependency graph:

```bash
# Check for issues
ioc-arise analyze --check-cycles

# Review dependency structure
ioc-arise analyze --verbose
```

### Monitor Container Size

Keep track of your container complexity:

```bash
# Count dependencies
grep -c "new " container.gen.ts

# Check file size
ls -la container.gen.ts
```

## Migration Strategies

### Gradual Adoption

Adopt IoC Arise gradually in existing projects:

1. Start with a small module
2. Generate container for that module only
3. Gradually expand to other modules
4. Eventually cover the entire application

### Legacy Code Integration

Integrate with existing dependency injection:

```typescript
// Combine with existing DI container
import { container as generatedContainer } from './container.gen';
import { legacyContainer } from './legacy-container';

export const hybridContainer = {
  ...legacyContainer,
  ...generatedContainer
};
```

## Next Steps

- Explore [Configuration Reference](/reference/configuration/) for detailed options
- Check out [Advanced Examples](/guides/examples/) for complex scenarios
- Learn about [CLI Reference](/reference/cli/) for all available commands