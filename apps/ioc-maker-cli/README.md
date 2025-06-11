# IoC Arise

A command-line tool that automatically generates type-safe IoC (Inversion of Control) containers for TypeScript projects. It analyzes your classes, detects dependencies, and creates a container file with proper instantiation order.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration File](#configuration-file)
  - [Config File Location](#config-file-location)
  - [Priority Order](#priority-order)
- [Examples](#examples)
  - [Basic Example](#basic-example)
  - [Multi-Module Example](#multi-module-example)
- [Usage in Your Code](#usage-in-your-code)
- [Development](#development)
- [Limitations](#limitations)
- [Contributing](#contributing)

## Features

- 🔍 **Automatic Detection**: Finds all classes implementing specific interfaces
- 🧠 **Dependency Analysis**: Parses constructor dependencies from TypeScript code
- 📊 **Topological Sorting**: Ensures correct instantiation order
- 🛡️ **Type Safety**: Generates fully typed container with IDE autocompletion
- 🚫 **No Decorators**: Pure static analysis, no runtime registration needed
- ⚠️ **Circular Dependency Detection**: Warns about dependency cycles

## Installation

```bash
# Install globally
npm install -g @notjustcoders/ioc-arise

# Or use with npx
npx @notjustcoders/ioc-arise --help

# For development
pnpm install
pnpm run build
```

## Usage

```bash
# Basic usage
ioc-arise generate

# With custom source and output
ioc-arise generate --source src --output src/container.gen.ts
```

## Configuration File

You can create an `ioc.config.json` file in the same directory as your source code to set default options. CLI arguments will override config file settings.

```json
{
  "source": "src",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/node_modules/**"
  ],
  "checkCycles": false,
  "verbose": true
}
```

### Config File Location

The config file should be placed in the same directory as your source code. For example, if your source directory is `src`, place `ioc.config.json` in the `src` directory.

### Priority Order

1. CLI arguments (highest priority)
2. Config file settings
3. Default values (lowest priority)

## Examples

### Basic Example

Directory structure:
```
minimal-todo/
├── entities/Todo.ts
├── repositories/
│   ├── ITodoRepository.ts
│   └── InMemoryTodoRepository.ts
├── services/
│   ├── ITodoService.ts
│   └── TodoService.ts
├── ioc.config.json
└── container.gen.ts (generated)
```

Configuration (`ioc.config.json`):
```json
{
  "source": ".",
  "output": "container.gen.ts"
}
```

Generated container:
```typescript
// ... imports and lazy initialization functions ...

export const container = {
  get ITodoService(): TodoService {
    return getTodoService();
  },
  get ITodoRepository(): InMemoryTodoRepository {
    return getInMemoryTodoRepository();
  },
};

export type Container = typeof container;
```

### Multi-Module Example

Directory structure:
```
simple-modules/
├── user/
│   ├── User.ts
│   ├── IUserRepository.ts
│   ├── UserRepository.ts
│   ├── IUserService.ts
│   └── UserService.ts
├── todo/
│   ├── Todo.ts
│   ├── ITodoRepository.ts
│   ├── TodoRepository.ts
│   ├── ITodoService.ts
│   └── TodoService.ts
├── ioc.config.json
└── container.gen.ts (generated)
```

Configuration (`ioc.config.json`):
```json
{
  "source": ".",
  "output": "container.gen.ts",
  "modules": {
    "UserModule": ["user/**"],
    "TodoModule": ["todo/**"]
  }
}
```

Generated container:
```typescript
// ... imports ...

// Module container functions
function createUserModuleContainer() {
  // ... lazy initialization variables ...
  // Lazy initialization for UserModule services
  return {
    get IUserService(): UserService { /* ... */ },
    get IUserRepository(): UserRepository { /* ... */ }
  };
}

function createTodoModuleContainer(userModuleContainer) {
  // ... lazy initialization variables ...
  // TodoModule with cross-module dependencies
  return {
    get ITodoService(): TodoService { /* ... */ },
    get ITodoRepository(): TodoRepository { /* ... */ }
  };
}

// Module instantiation with dependency injection
const userModuleContainer = createUserModuleContainer();
const todoModuleContainer = createTodoModuleContainer(userModuleContainer);

export const container = {
  userModule: userModuleContainer,
  todoModule: todoModuleContainer
};

export type Container = typeof container;
```

See the `examples/` directory for complete working examples.

## Usage in Your Code

```typescript
import { container } from './container.gen';

// Basic usage
const todoService = container.ITodoService;
const todos = await todoService.getAllTodos();

// Multi-module usage
const userService = container.userModule.IUserService;
const todoService = container.todoModule.ITodoService;
```

## Development

```bash
# Run in development mode
pnpm run dev

# Build for production
pnpm run build

# Run built version
pnpm run start
```

## Limitations

- Only detects classes using the `implements` keyword
- Constructor parameters must be typed
- Circular dependencies are detected and warned about, but not automatically resolved
- Only analyzes TypeScript files (`.ts` extension)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.