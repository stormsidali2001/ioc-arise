# useValue Example

This example demonstrates how to use `useValue` for dependency injection with plain object services (functional programming style).

## Overview

The `useValue` pattern allows you to register pre-created instances directly in the container, without requiring classes or factory functions. This is perfect for:

- Plain object services (functional programming style)
- Configuration objects
- Third-party instances
- Mock/test doubles

## Structure

```
use-value-example/
├── services/
│   ├── IUserService.ts      # Interface
│   ├── userService.ts        # Plain object implementation
│   ├── IConfigService.ts     # Interface
│   └── configService.ts      # Plain object implementation
├── ioc.config.json           # IoC configuration
├── demo.ts                   # Demo script
└── README.md
```

## Key Features

1. **Plain Object Services**: Services are simple objects that implement interfaces
2. **No Classes Required**: Perfect for functional programming patterns
3. **Always Singleton**: `useValue` services are always singletons (pre-created instances)
4. **Type Safety**: Full TypeScript support with interface types
5. **Flexible Detection**: Values are detected by `@value` JSDoc annotation or `valuePattern` regex

## Example Code

### Interface Definition

```typescript
// services/IUserService.ts
export interface IUserService {
  getUser(id: string): string;
  createUser(data: { name: string; email: string }): { id: string; name: string; email: string };
}
```

### Plain Object Implementation

```typescript
// services/userService.ts
import { IUserService } from './IUserService';

/**
 * @value
 */
export const userService: IUserService = {
  getUser: (id: string) => {
    return `User-${id}`;
  },
  createUser: (data: { name: string; email: string }) => {
    return {
      id: `user-${Date.now()}`,
      name: data.name,
      email: data.email,
    };
  },
};
```

## Value Detection

Values are automatically detected if they:
- Are marked with `@value` JSDoc annotation (default behavior)
- Match the `valuePattern` regex if configured in `ioc.config.json`
- Implement a known interface (backward compatibility fallback)

## Generated Container

When you run `ioc-arise generate`, the container will include:

```typescript
container.register('IUserService', {
  useValue: userService,
  lifecycle: Lifecycle.Singleton,
});

container.register('IConfigService', {
  useValue: configService,
  lifecycle: Lifecycle.Singleton,
});
```

## Usage

```typescript
import { container } from './container.gen';

// Resolve plain object services
const userService = container.resolve('IUserService');
const configService = container.resolve('IConfigService');

// Use the services
const user = userService.getUser('123');
const config = configService.getApiUrl();
```

## When to Use useValue

- **Plain Object Services**: When you prefer functional programming over classes
- **Configuration Objects**: For app configuration that doesn't need dependencies
- **Third-Party Instances**: For pre-created instances from external libraries
- **Mock/Test Doubles**: For testing with mock objects

## Differences from useClass and useFactory

| Feature | useClass | useFactory | useValue |
|---------|----------|------------|----------|
| **Creates instance?** | Yes (via `new`) | Yes (via function call) | No (uses existing) |
| **Dependencies?** | Yes (constructor) | Yes (function params) | No (pre-created) |
| **Lifecycle Transient?** | Yes | Yes | No (always singleton) |
| **When created?** | On resolve | On resolve | Already exists |

## Running the Example

1. Generate the container:
```bash
cd apps/ioc-maker-cli/examples/use-value-example
node ../../dist/index.js generate
```

2. Run the demo:
```bash
npx tsx demo.ts
```

## Configuration

You can configure value detection patterns in `ioc.config.json`:

```json
{
  "valuePattern": "Service$"
}
```

This will match any value name ending with "Service" (case-insensitive), in addition to values with `@value` annotations.

## Benefits

1. **Functional Programming**: No classes required, just plain objects
2. **Simple**: Direct object registration without construction logic
3. **Type Safe**: Full TypeScript support with interfaces
4. **Testable**: Easy to mock by providing different objects
5. **Flexible**: Control detection scope with patterns in large projects

