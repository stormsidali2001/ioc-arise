# Duplicate Interfaces Example

This example demonstrates how IoC Arise handles the error case where multiple classes implement the same interface.

## Structure

- **Interface**: `INotificationService` - a single interface
- **Implementations**: 
  - `EmailNotificationService` implements `INotificationService`
  - `SmsNotificationService` implements `INotificationService` 
  - `PushNotificationService` implements `INotificationService`

## Key Points

1. Three different classes implement the same `INotificationService` interface
2. This creates ambiguity for dependency injection - which implementation should be used?
3. IoC Arise should detect this and throw a clear error

## Expected Behavior

When running `npx @notjustcoders/ioc-arise generate`, the tool should:
- Detect that `INotificationService` is implemented by multiple classes
- Log detailed error information showing which classes implement the duplicate interface
- Throw an error with a clear message about the duplicate implementations
- Stop the generation process

## Error Message Expected

```
Error: Interface 'INotificationService' is implemented by multiple classes:
  - EmailNotificationService (/path/to/EmailNotificationService.ts)
  - SmsNotificationService (/path/to/SmsNotificationService.ts)
  - PushNotificationService (/path/to/PushNotificationService.ts)

Multiple classes implement the same interface(s): INotificationService. Each interface should only be implemented by one class for proper dependency injection.
```

## Running the Example

1. Try to generate the container (this should fail):
   ```bash
   npx @notjustcoders/ioc-arise generate
   ```

2. The command should exit with an error and detailed information about the duplicate implementations.