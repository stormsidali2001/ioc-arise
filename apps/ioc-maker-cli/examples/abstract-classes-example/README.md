# Abstract Classes Example - Two Module Architecture

This example demonstrates a two-module architecture using abstract classes and dependency injection with cross-module dependencies.

## Architecture Overview

### Modules

1. **User Module** (`userModule`)
   - `UserRepository` - extends `AbstractRepository`
   - `UserUseCase` - business logic for user operations

2. **Product Module** (`productModule`)
   - `ProductRepository` - extends `AbstractRepository`
   - `ProductUseCase` - business logic for product operations
   - **Cross-module dependency**: `ProductUseCase` depends on `UserRepository` from the user module

### Directory Structure

```
├── abstracts/
│   └── AbstractRepository.ts     # Base abstract class for repositories
├── entities/
│   ├── User.ts                   # User entity interface
│   └── Product.ts                # Product entity interface
├── implementations/
│   ├── UserRepository.ts         # User repository implementation
│   └── ProductRepository.ts      # Product repository implementation
├── use-cases/
│   ├── UserUseCase.ts            # User business logic
│   └── ProductUseCase.ts         # Product business logic (depends on UserRepository)
├── container.gen.ts              # Dependency injection container
├── demo.ts                       # Usage demonstration
└── README.md                     # This file
```

## Key Features

### 1. Abstract Repository Pattern
All repositories extend `AbstractRepository` which provides:
- Common logging functionality
- Abstract methods that must be implemented
- Consistent interface across all repositories

### 2. Modular Architecture
- Clear separation between user and product domains
- Each module encapsulates its own entities, repositories, and use cases
- Modules can depend on each other through the container

### 3. Cross-Module Dependencies
- `ProductUseCase` depends on `UserRepository` to validate user existence
- Demonstrates how modules can interact while maintaining separation
- Dependencies are resolved through the dependency injection container

### 4. Dependency Injection
- Container manages all dependencies
- Singleton pattern ensures single instances
- Lazy initialization for better performance

## Usage

### Running the Demo

```bash
# Compile TypeScript (if needed)
npx tsc demo.ts --target es2017 --module commonjs

# Run the demo
node demo.js
```

### Using the Container

```typescript
import { container } from './container.gen';

// Access user module services
const userUseCase = container.userModule.UserUseCase;
const userRepository = container.userModule.UserRepository;

// Access product module services
const productUseCase = container.productModule.ProductUseCase;
const productRepository = container.productModule.ProductRepository;

// Create a user
const user = await userUseCase.createUser({
  name: 'John Doe',
  email: 'john@example.com'
});

// Create a product (validates user exists)
const product = await productUseCase.createProduct({
  name: 'Product Name',
  description: 'Product Description',
  price: 99.99,
  userId: user.id
});
```

## Cross-Module Dependency Example

The `ProductUseCase` demonstrates cross-module dependency by:

1. **User Validation**: Before creating/updating products, it validates that the referenced user exists
2. **Data Enrichment**: The `getProductWithUser()` method fetches both product and user data
3. **Business Rules**: Enforces that products must belong to valid users

```typescript
// ProductUseCase constructor shows the cross-module dependency
constructor(
  private productRepository: ProductRepository,
  private userRepository: UserRepository // <- From user module
) {}
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each module handles its own domain
2. **Reusability**: Modules can be reused in different contexts
3. **Testability**: Easy to mock dependencies for unit testing
4. **Maintainability**: Clear boundaries make code easier to maintain
5. **Scalability**: Easy to add new modules or modify existing ones

## IOC Configuration

The `ioc.config.json` file configures the IOC container generation:

```json
{
  "source": ".",
  "output": "container.gen.ts",
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "verbose": true
}
```

This tells the IOC maker to scan the current directory and generate the container file while excluding test files.