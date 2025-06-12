# Use Cases Example

This example demonstrates how IoC Arise handles classes that do not implement interfaces but are used as dependencies (like use cases in clean architecture).

## Structure

- **Repositories**: `IUserRepository` and `UserRepository` (implements interface)
- **Services**: `IEmailService`, `EmailService`, and `IApplicationService`, `ApplicationService` (implement interfaces)
- **Use Cases**: `CreateUserUseCase`, `GetUserUseCase`, `UserController` (do NOT implement interfaces)

## Key Points

1. Use case classes (`CreateUserUseCase`, `GetUserUseCase`, `UserController`) do not implement interfaces
2. These classes are used as dependencies by other classes
3. IoC Arise should include them in the container because they are injected as dependencies
4. Classes that don't implement interfaces AND are not used as dependencies should be excluded

## Expected Behavior

When running `npx @notjustcoders/ioc-arise generate`, the tool should:
- Include all repository and service classes (they implement interfaces)
- Include use case classes because they are used as dependencies
- Generate a working container with proper dependency injection

## Running the Example

1. Generate the container:
   ```bash
   npx @notjustcoders/ioc-arise generate
   ```

2. The generated container should include all classes that are either:
   - Implementing interfaces, OR
   - Used as dependencies by other classes