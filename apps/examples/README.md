# IOC-Arise Examples

This directory contains comprehensive examples demonstrating various features of the `ioc-arise` dependency injection framework and CLI tool.

## Quick Start

Each example has its own README with detailed explanations. 

### Running Examples

This is a standalone app using `tsx` to run TypeScript files directly.

```bash
# Install dependencies (from root)
pnpm install

# Generate containers for examples
cd apps/examples
pnpm generate:all

# Run demos
pnpm demo:use-value
pnpm demo:factory-functions
pnpm demo:scope
pnpm demo:simple-modules
```

### Individual Example Commands

Generate and run individual examples:
```bash
# Generate container
pnpm generate:use-value

# Run demo
pnpm demo:use-value
```

## Examples Overview

### 🎯 Core Features

#### 1. **minimal-todo** - Getting Started
Simple todo application demonstrating basic DI setup.
```bash
pnpm generate:minimal-todo
```

#### 2. **simple-modules** - Basic Module System
Simple example with user and todo modules.
```bash
pnpm generate:simple-modules
pnpm demo:simple-modules
```

### 🔧 Advanced Patterns

#### 3. **abstract-classes-example** - Abstract Classes
Demonstrates abstract class support:
- Abstract base classes as dependencies
- String token registration for abstract classes
- Type-safe resolution
```bash
pnpm generate:abstract-classes
```

#### 4. **scope-example** - Lifecycle Management
Shows Singleton vs Transient lifecycles:
- Singleton services (shared instance)
- Transient services (new instance per resolution)
- Mixed usage patterns
```bash
pnpm generate:scope
pnpm demo:scope
```

### ⚠️ Error Detection

#### 5. **circular-deps-classes** - Class Circular Dependencies
Example that intentionally triggers circular dependency detection between classes.
```bash
pnpm generate:circular-deps-classes
# Expected: Error about circular dependencies
```

#### 6. **circular-deps-modules** - Module Circular Dependencies
Example that intentionally triggers circular dependency detection between modules.
```bash
pnpm generate:circular-deps-modules
# Expected: Error about module circular dependencies
```

#### 7. **duplicate-interfaces-example** - Duplicate Interface Detection
Example showing duplicate interface implementation detection.
```bash
pnpm generate:duplicate-interfaces
# Expected: Error about multiple implementations
```

#### 8. **name-collision-example** - Name Collision Handling
Demonstrates automatic handling of classes with the same name from different modules:
- Automatic import aliasing
- Collision detection and resolution
```bash
pnpm generate:name-collision
pnpm demo:name-collision
```

### 📚 Other Examples

#### 9. **factory-functions-example** - Factory Functions
Demonstrates factory function support for dependency injection:
- Factory functions with dependencies
- Context object pattern
- Separate parameters pattern
```bash
pnpm generate:factory-functions
pnpm demo:factory-functions
```

#### 10. **use-cases-example** - Use Case Pattern
Demonstrates the use case pattern with repositories and services.
```bash
pnpm generate:use-cases
```

#### 11. **use-value-example** - Plain Object Services (useValue)
Demonstrates using `useValue` for dependency injection with plain object services:
- Plain object services (functional programming style)
- Configuration objects
- No classes required
- Always singleton lifecycle
```bash
pnpm generate:use-value
pnpm demo:use-value
```

## Example Categories

### By Feature
- **Class-based DI**: minimal-todo, clean-architecture, simple-modules
- **Abstract Classes**: abstract-classes-example
- **Modules**: clean-architecture, simple-modules, circular-deps-modules
- **Lifecycles**: scope-example
- **Factory Functions**: factory-functions-example
- **Plain Object Services (useValue)**: use-value-example

### By Learning Path
1. Start with: **minimal-todo**
2. Then try: **simple-modules**
3. Advanced: **clean-architecture**
4. Special features: **abstract-classes-example**
5. Error handling: **circular-deps-*****, **duplicate-interfaces-example**

## Running Examples

### Generate All Containers
Generate containers for all examples:
```bash
cd apps/examples
pnpm generate:all
```

### Generate Individual Containers
```bash
pnpm generate:use-value
pnpm generate:factory-functions
# ... etc
```


## Example Structure

Each example typically contains:
- `ioc.config.ts` - TypeScript configuration for code generation (using `defineConfig`)
- `container.gen.ts` - Generated container (after running generate command)
- `container.gen.d.ts` - Generated type declarations
- `demo.ts` - Demo script (if applicable)
- `README.md` - Detailed explanation
- Source files organized by feature

## Key Concepts Demonstrated

| Concept | Examples |
|---------|----------|
| Interface-based DI | clean-architecture, minimal-todo |
| Abstract classes | abstract-classes-example |
| Modules | clean-architecture, simple-modules |
| Lifecycles | scope-example |
| Circular dependency detection | circular-deps-classes, circular-deps-modules |
| Name collision handling | name-collision-example |
| Type safety | All examples with `.d.ts` files |

## Notes

All examples use **automatic code generation** via `ioc-maker-cli` to analyze TypeScript classes and generate type-safe DI containers.

## Contributing

When adding new examples:
1. Create a descriptive directory name
2. Include a comprehensive README.md
3. Add `ioc.config.ts` using `defineConfig` from `@notjustcoders/ioc-arise/config`
4. Add generate and demo scripts to `package.json`
5. Update this main README with the new example

