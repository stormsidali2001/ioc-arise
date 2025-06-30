# Duplicate Interfaces Example

This example demonstrates how IoC Arise handles the error case where multiple classes implement the same interface.

## Project Structure

```
duplicate-interfaces-example/
├── ioc.config.json
└── services/
    ├── INotificationService.ts      # Single interface
    ├── EmailNotificationService.ts  # First implementation
    ├── SmsNotificationService.ts    # Second implementation (causes error)
    └── PushNotificationService.ts   # Third implementation (causes error)
```

## Configuration

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
    "DuplicateModule": [
      "services/**"
    ]
  }
}
```

## Interface Definition

```typescript
// services/INotificationService.ts
export interface INotificationService {
  sendNotification(message: string, recipient: string): Promise<void>;
  getServiceName(): string;
}
```

## Multiple Implementations

### EmailNotificationService
```typescript
import { INotificationService } from './INotificationService';

export class EmailNotificationService implements INotificationService {
  async sendNotification(message: string, recipient: string): Promise<void> {
    console.log(`Sending EMAIL notification to ${recipient}: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  getServiceName(): string {
    return 'Email Notification Service';
  }
}
```

### SmsNotificationService
```typescript
import { INotificationService } from './INotificationService';

export class SmsNotificationService implements INotificationService {
  async sendNotification(message: string, recipient: string): Promise<void> {
    console.log(`Sending SMS notification to ${recipient}: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  getServiceName(): string {
    return 'SMS Notification Service';
  }
}
```

### PushNotificationService
```typescript
import { INotificationService } from './INotificationService';

export class PushNotificationService implements INotificationService {
  async sendNotification(message: string, recipient: string): Promise<void> {
    console.log(`Sending PUSH notification to ${recipient}: ${message}`);
    await new Promise(resolve => setTimeout(resolve, 25));
  }

  getServiceName(): string {
    return 'Push Notification Service';
  }
}
```

## Key Points

1. **Single Interface**: `INotificationService` defines the contract for notification services
2. **Multiple Implementations**: Three different classes implement the same interface
3. **Ambiguity Problem**: This creates ambiguity for dependency injection - which implementation should be used?
4. **Error Detection**: IoC Arise detects this and throws a clear error to prevent runtime issues

## Expected Behavior

When running `npx @notjustcoders/ioc-arise generate`, the tool should:
- Scan all classes and detect interface implementations
- Identify that `INotificationService` is implemented by multiple classes
- Log detailed error information showing which classes implement the duplicate interface
- Throw an error with a clear message about the duplicate implementations
- Stop the generation process to prevent ambiguous dependency injection

## Expected Error Message

```
Error: Interface 'INotificationService' is implemented by multiple classes:
  - EmailNotificationService (/path/to/services/EmailNotificationService.ts)
  - SmsNotificationService (/path/to/services/SmsNotificationService.ts)
  - PushNotificationService (/path/to/services/PushNotificationService.ts)

Multiple classes implement the same interface(s): INotificationService. Each interface should only be implemented by one class for proper dependency injection.
```

## Running the Example

1. Try to generate the container (this should fail):
   ```bash
   npx @notjustcoders/ioc-arise generate
   ```

2. The command should exit with an error and detailed information about the duplicate implementations

## Resolution Strategies

To fix this issue, you have several options:

### Option 1: Use Factory Pattern
Create a factory class that decides which implementation to use:

```typescript
export interface INotificationFactory {
  createEmailService(): INotificationService;
  createSmsService(): INotificationService;
  createPushService(): INotificationService;
}
```

### Option 2: Use Specific Interfaces
Create specific interfaces for each implementation:

```typescript
export interface IEmailNotificationService extends INotificationService {}
export interface ISmsNotificationService extends INotificationService {}
export interface IPushNotificationService extends INotificationService {}
```

### Option 3: Use Modules with Different Names
Organize implementations into different modules or use different naming patterns to avoid conflicts.