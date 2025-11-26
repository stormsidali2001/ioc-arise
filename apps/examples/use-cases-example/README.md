# Use Cases Example

This example demonstrates how IoC Arise handles classes that do not implement interfaces but are used as dependencies (like use cases in clean architecture).

## Project Structure

```
use-cases-example/
├── ioc.config.json
├── container.gen.ts          # Generated container
├── repositories/
│   ├── IUserRepository.ts    # Repository interface
│   └── UserRepository.ts     # Repository implementation
├── services/
│   ├── IEmailService.ts      # Email service interface
│   ├── EmailService.ts       # Email service implementation
│   ├── IApplicationService.ts # Application service interface
│   └── ApplicationService.ts  # Application service implementation
└── use-cases/
    ├── CreateUserUseCase.ts  # Use case (no interface)
    ├── GetUserUseCase.ts     # Use case (no interface)
    └── UserController.ts     # Controller (no interface)
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
  "verbose": true
}
```

## Key Points

1. **Interface-based classes**: Repository and service classes implement interfaces (`IUserRepository`, `IEmailService`, `IApplicationService`)
2. **Non-interface classes**: Use case classes (`CreateUserUseCase`, `GetUserUseCase`, `UserController`) do NOT implement interfaces
3. **Dependency inclusion**: IoC Arise includes non-interface classes because they are used as dependencies by other classes
4. **Automatic detection**: The tool automatically detects and includes all classes that participate in dependency injection

## Generated Container Structure

The generated container has a `coreModule` structure:

```typescript
export const container = {
  coreModule: {
    // Interface-based access (recommended)
    IUserRepository: UserRepository,
    IEmailService: EmailService, 
    IApplicationService: ApplicationService,
    
    // Direct class access
    CreateUserUseCase: CreateUserUseCase,
    GetUserUseCase: GetUserUseCase,
    UserController: UserController
  }
};
```

## Usage Examples

### Using Direct Container Access

```typescript
import { container } from './container.gen';

// Access services via interfaces
const userRepo = container.coreModule.IUserRepository;
const emailService = container.coreModule.IEmailService;
const appService = container.coreModule.IApplicationService;

// Access use cases directly
const createUserUseCase = container.coreModule.CreateUserUseCase;
const getUserUseCase = container.coreModule.GetUserUseCase;
const userController = container.coreModule.UserController;

// Run the application
await appService.runUserOperations();
```

### Using the inject() Function

```typescript
import { inject } from './container.gen';

// Inject services by interface
const userRepo = inject('coreModule.IUserRepository');
const emailService = inject('coreModule.IEmailService');
const appService = inject('coreModule.IApplicationService');

// Inject use cases by class name
const createUserUseCase = inject('coreModule.CreateUserUseCase');
const userController = inject('coreModule.UserController');

// Example usage
await userController.createUser('Alice Johnson', 'alice@example.com');
await userController.getUser('1');
```

### Initialization Hook

```typescript
import { onInit } from './container.gen';

// The onInit function is called automatically when first accessing the container
// You can customize it for post-construction logic:
export function onInit(): void {
  console.log('Container initialized');
  // Add your initialization logic here
}
```

## Running the Example

1. Generate the container:
   ```bash
   npx @notjustcoders/ioc-arise generate
   ```

2. The generated container includes all classes that are either:
   - Implementing interfaces (repositories and services), OR
   - Used as dependencies by other classes (use cases and controllers)

3. Use either direct container access or the `inject()` function to retrieve dependencies

4. The container handles all dependency injection automatically with proper singleton management