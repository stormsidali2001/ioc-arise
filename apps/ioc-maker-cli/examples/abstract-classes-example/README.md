# Abstract Classes Example - Two Module Architecture

This example demonstrates a two-module architecture using abstract classes and dependency injection with cross-module dependencies.

## Architecture Overview

### Modules

1. **User Module** (`userModule`)
   - `UserRepository` - extends `AbstractUserRepository`
   - `UserUseCase` - business logic for user operations (depends on `AbstractUserRepository`)

2. **Product Module** (`productModule`)
   - `ProductRepository` - extends `AbstractProductRepository`
   - `ProductUseCase` - business logic for product operations (depends on `AbstractProductRepository`)
   - `InternalProductNestedUseCase` - internal nested use case within product module
   - **Cross-module dependency**: `ProductUseCase` depends on `AbstractUserRepository` from the user module

### Directory Structure

```
├── abstracts/
│   ├── AbstractUserRepository.ts     # Abstract class for user repositories
│   └── AbstractProductRepository.ts  # Abstract class for product repositories
├── entities/
│   ├── User.ts                       # User entity interface
│   └── Product.ts                    # Product entity interface
├── implementations/
│   ├── UserRepository.ts             # User repository implementation
│   └── ProductRepository.ts          # Product repository implementation
├── use-cases/
│   ├── UserUseCase.ts                # User business logic
│   ├── ProductUseCase.ts             # Product business logic (depends on UserRepository)
│   └── InternalProductNestedUseCase.ts # Internal product use case
├── UserModule.gen.ts                 # Generated user module container
├── ProductModule.gen.ts              # Generated product module container
├── container.gen.ts                  # Main dependency injection container
├── demo.ts                           # Usage demonstration
├── test-container.ts                 # Container testing
└── README.md                         # This file
```

## Key Features

### 1. Abstract Repository Pattern
All repositories extend specific abstract classes which provide:
- Domain-specific abstract methods that must be implemented
- Common logging functionality through protected methods
- Consistent interface across repositories in the same domain

### 2. Modular Architecture
- Clear separation between user and product domains using IoC Arise's module system
- Each module encapsulates its own entities, repositories, and use cases
- Modules can depend on each other through cross-module dependencies

### 3. Cross-Module Dependencies
- `ProductUseCase` depends on `AbstractUserRepository` to validate user existence
- Demonstrates how modules can interact while maintaining separation through abstractions
- Dependencies are resolved automatically through the dependency injection container
- Use cases depend on abstract classes, not concrete implementations, ensuring loose coupling

### 4. Dependency Injection with Type Safety
- Container manages all dependencies with full TypeScript support
- Two access patterns: direct container access and `inject()` function
- Lazy initialization for better performance
- `onInit()` function for post-construction initialization

## Usage

### Running the Demo

```bash
# Generate the container (if not already generated)
npx ioc-arise generate

# Run the demo
npx ts-node demo.ts
```

### Using the Container

#### Method 1: Direct Container Access

```typescript
import { container } from './container.gen';

// Access user module services
const userUseCase = container.userModule.UserUseCase;
const userRepository = container.userModule.UserRepository;

// Access product module services  
const productUseCase = container.productModule.ProductUseCase;
const productRepository = container.productModule.ProductRepository;
```

#### Method 2: Using inject() Function (Type-Safe)

```typescript
import { inject } from './container.gen';

// Access services with full type safety
const userUseCase = inject('userModule.UserUseCase');
const productUseCase = inject('productModule.ProductUseCase');
const userRepository = inject('userModule.UserRepository');
const productRepository = inject('productModule.ProductRepository');
```

### Example Usage

```typescript
// Create a user
const user = await userUseCase.createUser({
  name: 'John Doe',
  email: 'john@example.com'
});

// Create a product (validates user exists through cross-module dependency)
const product = await productUseCase.createProduct({
  name: 'Awesome Product',
  description: 'A really awesome product',
  price: 99.99,
  userId: user.id
});

// Get product with user details (demonstrates cross-module data access)
const productWithUser = await productUseCase.getProductWithUser(product.id);
```

## Cross-Module Dependency Example

The `ProductUseCase` demonstrates cross-module dependency by:

1. **User Validation**: Before creating/updating products, it validates that the referenced user exists
2. **Data Enrichment**: The `getProductWithUser()` method fetches both product and user data
3. **Business Rules**: Enforces that products must belong to valid users

```typescript
// ProductUseCase constructor shows the cross-module dependency
constructor(
  private productRepository: AbstractProductRepository,
  private userRepository: AbstractUserRepository, // <- From user module
  private internalNestedUseCase: InternalProductNestedUseCase
) {}
```

## Post-Construction Initialization

The generated container includes an `onInit()` function that can be customized for post-construction logic:

```typescript
import { onInit } from './container.gen';

// The onInit function is called automatically when inject() is first used
// You can modify it in the generated container.gen.ts file for custom initialization
```

## Benefits of This Architecture

1. **Separation of Concerns**: Each module handles its own domain
2. **Reusability**: Modules can be reused in different contexts  
3. **Testability**: Easy to mock dependencies for unit testing
4. **Maintainability**: Clear boundaries make code easier to maintain
5. **Scalability**: Easy to add new modules or modify existing ones
6. **Type Safety**: Full TypeScript support with compile-time validation

## IoC Configuration

The `ioc.config.json` file configures the IoC container generation with module support:

```json
{
  "source": ".",
  "output": "container.gen.ts",
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "verbose": true,
  "modules": {
    "UserModule": [
      "**/**/*User*"
    ],
    "ProductModule": [
      "**/**/*Product*"
    ]
  }
}
```

This configuration:
- Scans the current directory for classes
- Groups classes matching `*User*` pattern into `UserModule`
- Groups classes matching `*Product*` pattern into `ProductModule`
- Generates separate module containers with cross-module dependency support
- Excludes test files from analysis