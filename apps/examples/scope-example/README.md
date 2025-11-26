# Scope Example - Singleton vs Transient Lifecycles

This example demonstrates IoC Arise's scope management using JSDoc `@scope` annotations to control service lifecycles.

## Overview

This example showcases two different dependency injection scopes:
- **Singleton**: One instance shared across the entire application
- **Transient**: New instance created for each injection

## Structure

```
scope-example/
├── services/
│   ├── ISingletonService.ts     # Singleton service interface
│   ├── SingletonService.ts      # Singleton service implementation (@scope singleton)
│   ├── ITransientService.ts     # Transient service interface  
│   ├── TransientService.ts      # Transient service implementation (@scope transient)
│   └── MixedService.ts          # Service using both singleton and transient dependencies
├── container.gen.ts             # Generated IoC container
├── demo.ts                      # Demonstration of scope behaviors
├── ioc.config.json             # IoC configuration
└── README.md                    # This file
```

## Key Features

### 1. Scope Annotations
Services use JSDoc `@scope` annotations to define their lifecycle:

```typescript
/**
 * @scope singleton
 */
export class SingletonService implements ISingletonService {
  // Single instance shared across application
}

/**
 * @scope transient  
 */
export class TransientService implements ITransientService {
  // New instance created each time
}
```

### 2. Singleton Behavior
- One instance created and reused throughout the application
- State is preserved across different access points
- Ideal for stateful services like caches, loggers, configuration

### 3. Transient Behavior  
- Fresh instance created for each injection
- No shared state between instances
- Ideal for stateless operations, data processors, utilities

### 4. Mixed Dependencies
- Services can depend on both singleton and transient services
- Container handles the complexity of scope management automatically

## Usage

### Running the Demo

```bash
# Generate the container
npx ioc-arise generate

# Run the demonstration
npx ts-node demo.ts
```

### Using the Container

#### Method 1: Direct Container Access

```typescript
import { container } from './container.gen';

// Access singleton services - always returns same instance
const singleton1 = container.coreModule.ISingletonService;
const singleton2 = container.coreModule.ISingletonService;
console.log(singleton1 === singleton2); // true

// Access transient services - returns new instance each time
const transient1 = container.coreModule.ITransientService;
const transient2 = container.coreModule.ITransientService;
console.log(transient1 === transient2); // false

// Mixed service that uses both scopes
const mixedService = container.coreModule.MixedService;
```

#### Method 2: Using inject() Function (Type-Safe)

```typescript
import { inject } from './container.gen';

// Access services with full type safety
const singletonService = inject('coreModule.ISingletonService');
const transientService = inject('coreModule.ITransientService');
const mixedService = inject('coreModule.MixedService');

// Demonstrate singleton behavior
const singleton1 = inject('coreModule.ISingletonService');
const singleton2 = inject('coreModule.ISingletonService');
console.log(singleton1.getInstanceId() === singleton2.getInstanceId()); // true

// Demonstrate transient behavior
const transient1 = inject('coreModule.ITransientService');
const transient2 = inject('coreModule.ITransientService');
console.log(transient1.getInstanceId() === transient2.getInstanceId()); // false
```

## Example Usage Scenarios

### Singleton Service Example

```typescript
// State persistence across multiple access points
const singleton1 = inject('coreModule.ISingletonService');
const singleton2 = inject('coreModule.ISingletonService');

singleton1.incrementCounter(); // Counter: 1
singleton2.incrementCounter(); // Counter: 2 (same instance!)
singleton1.log('Important message'); 

console.log(singleton2.getCounter()); // 2 - state is shared
console.log(singleton1.getLogs()); // Contains the logged message
```

### Transient Service Example

```typescript
// Fresh instances for independent operations
const transient1 = inject('coreModule.ITransientService');
const transient2 = inject('coreModule.ITransientService');

const result1 = transient1.processData('Hello');
const result2 = transient2.processData('World');

// Each instance has its own unique ID and processes independently
console.log(transient1.getInstanceId()); // e.g., "transient-123-abc"
console.log(transient2.getInstanceId()); // e.g., "transient-456-def"
```

### Mixed Service Example

```typescript
// Service that uses both singleton and transient dependencies
const mixedService = inject('coreModule.MixedService');

// Performs operations using both dependency types
const result = mixedService.performComplexOperation('test data');

// Get info about dependencies
const info = mixedService.getServiceInfo();
console.log('Mixed service ID:', info.mixedServiceId);
console.log('Singleton dependency ID:', info.singletonServiceId);
console.log('Transient dependency ID:', info.transientServiceId);
console.log('Operation count:', info.operationCount);
```

## Scope Implementation Details

### Singleton Pattern
```typescript
// Generated container creates single instance
let singletonService: SingletonService | undefined;

const getSingletonService = (): SingletonService => {
  if (!singletonService) {
    singletonService = new SingletonService();
  }
  return singletonService;
};
```

### Transient Pattern
```typescript
// Generated container creates new instance each time
const transientServiceFactory = (): TransientService => 
  new TransientService();

// Each access returns fresh instance
get ITransientService(): TransientService {
  return transientServiceFactory();
}
```

## Service Interfaces

### ISingletonService
```typescript
export interface ISingletonService {
  getInstanceId(): string;
  incrementCounter(): number;
  getCounter(): number;
  log(message: string): void;
  getCreationTime(): Date;
}
```

### ITransientService
```typescript
export interface ITransientService {
  getInstanceId(): string;
  processData(data: string): string;
  getCreationTime(): Date;
  performCalculation(a: number, b: number): number;
}
```

## Post-Construction Initialization

The generated container includes an `onInit()` function for custom setup:

```typescript
import { onInit } from './container.gen';

// The onInit function is called automatically when inject() is first used
// You can modify it in the generated container.gen.ts file for custom initialization
```

## IoC Configuration

Simple configuration file:

```json
{
  "outputFile": "./container.gen.ts"
}
```

This minimal configuration:
- Scans the current directory for classes
- Uses JSDoc `@scope` annotations to determine lifecycles
- Generates a single coreModule container
- Automatically resolves dependencies

## Benefits

1. **Lifecycle Control**: Explicit control over service lifecycles
2. **Performance**: Singletons reduce object creation overhead
3. **Memory Management**: Transients allow garbage collection
4. **State Management**: Clear distinction between stateful and stateless services
5. **Testability**: Easy to mock both singleton and transient dependencies
6. **Type Safety**: Full TypeScript support with scope-aware injection