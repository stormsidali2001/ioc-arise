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

// No annotation = singleton (eager loading)
class UserRepository implements IUserRepository {
  // Eagerly instantiated
}
```

**Detection Logic:**
```typescript
private extractScopeFromJSDoc(classNode: any): InjectionScope {
  const leadingComments = this.getLeadingComments(classNode);
  const scopeMatch = leadingComments.match(/@scope\s+(singleton|transient)/);
  return scopeMatch ? scopeMatch[1] as InjectionScope : 'singleton';
}
```

### 2. Mixed Generation Strategy

**Container Generation Approach:**
- **Singletons**: Generate direct instantiation (current behavior)
- **Transient**: Generate getter functions with lazy loading

**Generated Container Structure (Type-Safe Approach):**
```typescript
// Eager singleton instantiation
const userRepository = new UserRepository();
const createUserPresenter = new CreateUserPresenter();

// Lazy loading factories with proper typing
const createTempFileHandler = (): TempFileHandler => new TempFileHandler();

// Type-safe container object with proper getters
export const container = {
  // Singleton properties (direct access)
  IUserRepository: userRepository,
  ICreateUserOutputPort: createUserPresenter,
  
  // Transient properties (typed getters)
  get ITempFileHandler(): TempFileHandler {
    return createTempFileHandler();
  }
} as const;

// Type will be inferred correctly from the object structure
export type Container = typeof container;
```

### 3. Type Safety Preservation

**Maintain Current Type Structure with Proper Typing:**
```typescript
// Generated types remain exactly the same - no getters in type definition
export type Container = {
  IUserRepository: UserRepository;
  ICreateUserOutputPort: CreateUserPresenter;
  ITempFileHandler: TempFileHandler;
};

// Usage remains identical with full type safety
const userRepo = container.IUserRepository; // UserRepository type
const tempHandler = container.ITempFileHandler; // TempFileHandler type

// TypeScript will infer correct types for all properties
// No type assertions or 'any' types needed
```

### 4. Implementation Details

#### A. Type Definitions Extension
```typescript
// types.ts additions
export type InjectionScope = 'singleton' | 'transient';

export interface ClassInfo {
  // ... existing fields
  scope: InjectionScope;
}
```

#### B. Analyzer Modifications
```typescript
// analyzer.ts enhancements
private async analyzeFile(filePath: string): Promise<ClassInfo[]> {
  // ... existing logic
  
  for (const classNode of classNodes) {
    const scope = this.extractScopeFromJSDoc(classNode);
    
    classes.push({
      // ... existing fields
      scope
    });
  }
}
```

#### C. Generator Restructuring
```typescript
// generator.ts major changes
private generateContainerCode(sortedClasses: string[]): string {
  const imports = this.generateImports();
  const singletonInstantiations = this.generateSingletonInstantiations(sortedClasses);
  const lazySetup = this.generateLazySetup(sortedClasses);
  const containerObject = this.generateMixedContainer(sortedClasses);
  const typeExport = this.generateTypeExport();

  return `${imports}\n\n${singletonInstantiations}\n\n${lazySetup}\n\n${containerObject}\n\n${typeExport}\n`;
}

private generateSingletonInstantiations(sortedClasses: string[]): string {
  // Only generate direct instantiation for singletons
  const singletons = this.options.classes.filter(c => c.scope === 'singleton');
  // ... existing instantiation logic for singletons only
}

private generateLazySetup(sortedClasses: string[]): string {
  const nonSingletons = this.options.classes.filter(c => c.scope !== 'singleton');
  const factoryFunctions: string[] = [];
  
  // Generate typed factory functions for non-singletons
  for (const classInfo of nonSingletons) {
    const className = classInfo.name;
    const dependencies = this.getDependenciesForClass(classInfo.name);
    const dependencyParams = dependencies.map(dep => {
      const depInfo = this.options.classes.find(c => c.name === dep);
      if (depInfo?.scope === 'singleton') {
        return this.toVariableName(dep);
      } else {
        // For non-singleton dependencies, we need to create them
        return `create${dep}()`;
      }
    }).join(', ');
    
    factoryFunctions.push(`const create${className} = (): ${className} => new ${className}(${dependencyParams});`);
  }
  
  // Add request scope management
  factoryFunctions.push('');
  factoryFunctions.push('let currentRequestId = \'default\';');
  factoryFunctions.push('const requestInstances = new Map<string, any>();');
  factoryFunctions.push('');
  factoryFunctions.push('function getRequestScoped<T>(key: string, factory: () => T): T {');
  factoryFunctions.push('  const requestKey = `${currentRequestId}:${key}`;');
  factoryFunctions.push('  if (!requestInstances.has(requestKey)) {');
  factoryFunctions.push('    requestInstances.set(requestKey, factory());');
  factoryFunctions.push('  }');
  factoryFunctions.push('  return requestInstances.get(requestKey);');
  factoryFunctions.push('}');
  
  return factoryFunctions.join('\n');
}

private generateMixedContainer(sortedClasses: string[]): string {
  const properties: string[] = [];
  
  for (const classInfo of this.options.classes) {
    const propertyName = classInfo.interfaceName || classInfo.name;
    const variableName = this.toVariableName(classInfo.name);
    const className = classInfo.name;
    
    switch (classInfo.scope) {
      case 'singleton':
        properties.push(`  ${propertyName}: ${variableName},`);
        break;
      case 'transient':
        properties.push(`  get ${propertyName}(): ${className} { return create${className}(); },`);
        break;
    }
  }
  
  return `export const container = {\n${properties.join('\n')}\n} as const;\n\nexport type Container = typeof container;`;
}
```



### 5. Generated Container Example

```typescript
// container.gen.ts output
import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { UserRepository } from './repositories/UserRepository';
import { TempFileHandler } from './utils/TempFileHandler';

// Eager singleton instantiation
const userRepository = new UserRepository();
const getUserUseCase = new GetUserUseCase(userRepository);
const deleteUserUseCase = new DeleteUserUseCase(userRepository);

// Typed factory functions for lazy loading
const createTempFileHandler = (): TempFileHandler => new TempFileHandler();

// Type-safe container object with proper return types
export const container = {
  IUserRepository: userRepository,
  IGetUserInputPort: getUserUseCase,
  IDeleteUserInputPort: deleteUserUseCase,
  
  get ITempFileHandler(): TempFileHandler {
    return createTempFileHandler();
  }
} as const;

// Type will be correctly inferred with all proper return types
export type Container = typeof container;
```

### 6. Usage Examples

```typescript
// Singleton usage (unchanged)
const userRepo = container.IUserRepository; // Same instance always

// Transient usage (new instance each time)
const handler1 = container.ITempFileHandler; // New instance
const handler2 = container.ITempFileHandler; // Different instance
```

### 7. Testing Strategy

1. **Type Safety**: Ensure `container.IServiceName` maintains correct types
2. **Singleton Behavior**: Verify same instance returned for singletons
3. **Transient Behavior**: Verify new instances for transients
4. **Dependency Resolution**: Ensure lazy dependencies resolve correctly

### 8. Migration Path

1. **Phase 1**: Implement JSDoc parsing in analyzer
2. **Phase 2**: Modify generator for mixed instantiation
3. **Phase 3**: Update CLI with scope options
4. **Phase 4**: Add comprehensive testing

### 9. Benefits

- **Performance**: Singletons are pre-instantiated for fast access
- **Memory Efficiency**: Transients don't accumulate
- **Type Safety**: Full TypeScript support maintained
- **Backward Compatibility**: Existing usage patterns unchanged
- **No Runtime Reflection**: All dependency resolution at compile time

### 10. Type Safety Guarantees

**Full TypeScript Support:**
- All container properties maintain their exact types
- No `any` types or type assertions needed
- IntelliSense works perfectly for all properties
- Compile-time type checking for all dependencies
- Return types are explicitly declared for all getters

**Type Inference:**
```typescript
// All these have correct, specific types
const repo: UserRepository = container.IUserRepository;
const handler: TempFileHandler = container.ITempFileHandler;

// TypeScript will catch type mismatches at compile time
const wrong: string = container.IUserRepository; // ❌ Type error
```

### 11. Considerations

- **Circular Dependencies**: Need to handle lazy loading in dependency chains
- **Error Handling**: Proper error messages for missing dependencies
- **Performance**: Getter functions have slight overhead vs direct property access
- **Type Safety**: All properties maintain strict typing with explicit return type annotations

This plan maintains the current type-safe container structure while adding sophisticated dependency lifecycle management through JSDoc annotations and mixed instantiation strategies. **Full type safety is preserved through explicit return type annotations on all getter functions.**