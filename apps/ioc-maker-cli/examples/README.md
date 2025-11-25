# IOC-Arise Examples

This directory contains comprehensive examples demonstrating various features of the `ioc-arise` dependency injection framework and CLI tool.

## Quick Start

Each example has its own README with detailed explanations. Run the examples using the commands below.

## Examples Overview

### 🎯 Core Features

#### 1. **minimal-todo** - Getting Started
Simple todo application demonstrating basic DI setup.
```bash
pnpm test4:generate
```

#### 2. **clean-architecture** - Multi-Module Application
Demonstrates clean architecture with TodoModule and UserModule, showing:
- Multiple modules
- Interface-based dependencies
- Presenters and use cases
```bash
pnpm test1:generate
```

#### 3. **simple-modules** - Basic Module System
Simple example with user and todo modules.
```bash
pnpm test5:generate
```

### 🔧 Advanced Patterns

#### 4. **abstract-classes-example** - Abstract Classes
Demonstrates abstract class support:
- Abstract base classes as dependencies
- String token registration for abstract classes
- Type-safe resolution
```bash
pnpm test9:generate
```

#### 5. **scope-example** - Lifecycle Management
Shows Singleton vs Transient lifecycles:
- Singleton services (shared instance)
- Transient services (new instance per resolution)
- Mixed usage patterns

### ⚠️ Error Detection

#### 6. **circular-deps-classes** - Class Circular Dependencies
Example that intentionally triggers circular dependency detection between classes.
```bash
pnpm test3:generate
# Expected: Error about circular dependencies
```

#### 7. **circular-deps-modules** - Module Circular Dependencies
Example that intentionally triggers circular dependency detection between modules.
```bash
pnpm test2:generate
# Expected: Error about module circular dependencies
```

#### 8. **duplicate-interfaces-example** - Duplicate Interface Detection
Example showing duplicate interface implementation detection.
```bash
pnpm test7:generate
# Expected: Error about multiple implementations
```

#### 9. **name-collision-example** - Name Collision Handling
Demonstrates automatic handling of classes with the same name from different modules:
- Automatic import aliasing
- Collision detection and resolution
```bash
pnpm test8:generate
```

### 📚 Other Examples

#### 10. **use-cases-example** - Use Case Pattern
Demonstrates the use case pattern with repositories and services.
```bash
pnpm test6:generate
```

## Example Categories

### By Feature
- **Class-based DI**: minimal-todo, clean-architecture, simple-modules
- **Abstract Classes**: abstract-classes-example
- **Modules**: clean-architecture, simple-modules, circular-deps-modules
- **Lifecycles**: scope-example

### By Learning Path
1. Start with: **minimal-todo**
2. Then try: **simple-modules**
3. Advanced: **clean-architecture**
4. Special features: **abstract-classes-example**
5. Error handling: **circular-deps-*****, **duplicate-interfaces-example**

## Running Examples

### Generate Container
Most examples support container generation:
```bash
cd apps/ioc-maker-cli
pnpm test1:generate  # Replace with appropriate test number
```


## Example Structure

Each example typically contains:
- `ioc.config.json` - Configuration for code generation
- `container.gen.ts` - Generated container (after running generate command)
- `container.gen.d.ts` - Generated type declarations
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
3. Add `ioc.config.json` if using code generation
4. Add a test script to `package.json`
5. Update this main README with the new example

