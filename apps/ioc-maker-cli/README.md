# IoC Maker CLI

A command-line tool that automatically generates type-safe IoC (Inversion of Control) containers for TypeScript projects. It analyzes your classes, detects dependencies, and creates a container file with proper instantiation order.

## Features

- 🔍 **Automatic Detection**: Finds all classes implementing specific interfaces
- 🧠 **Dependency Analysis**: Parses constructor dependencies from TypeScript code
- 📊 **Topological Sorting**: Ensures correct instantiation order
- 🛡️ **Type Safety**: Generates fully typed container with IDE autocompletion
- 🚫 **No Decorators**: Pure static analysis, no runtime registration needed
- ⚠️ **Circular Dependency Detection**: Warns about dependency cycles

## Installation

```bash
# Install dependencies
pnpm install

# Build the CLI
pnpm run build

# Link for global usage (optional)
npm link
```

## Usage

### Generate Container

```bash
# Basic usage
ioc-maker generate

# Specify source and output directories
ioc-maker generate --source src --output src/container.gen.ts

# Filter by interface pattern
ioc-maker generate --interface "Service|Repository"

# Exclude specific patterns
ioc-maker generate --exclude "**/*.test.ts" "**/*.spec.ts"

# Verbose output
ioc-maker generate --verbose
```

### Analyze Project

```bash
# Analyze without generating
ioc-maker analyze

# Check for circular dependencies only
ioc-maker generate --check-cycles
```

### Command Options

| Option | Description | Default |
|--------|-------------|----------|
| `-s, --source <dir>` | Source directory to scan | `src` |
| `-o, --output <file>` | Output file path | `src/container.gen.ts` |
| `-i, --interface <pattern>` | Interface name pattern (regex) | - |
| `-e, --exclude <patterns...>` | Exclude file patterns | - |
| `--check-cycles` | Only check circular dependencies | `false` |
| `--verbose` | Enable verbose logging | `false` |

## Example

Given these TypeScript classes:

```typescript
// UserRepository.ts
export interface IUserRepository {
  findById(id: string): User;
}

export class UserRepository implements IUserRepository {
  findById(id: string): User {
    // implementation
  }
}

// UserService.ts
export interface IUserService {
  getUser(id: string): User;
}

export class UserService implements IUserService {
  constructor(private userRepository: UserRepository) {}
  
  getUser(id: string): User {
    return this.userRepository.findById(id);
  }
}
```

Running `ioc-maker generate` will create:

```typescript
// container.gen.ts
import { UserRepository } from './UserRepository';
import { UserService } from './UserService';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export const container = {
  userRepository,
  userService,
};

export type Container = typeof container;
```

## Usage in Your Code

```typescript
import { container } from './container.gen';

// Full type safety and autocompletion
const user = container.userService.getUser('123');
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
- Circular dependencies are not supported
- Only analyzes TypeScript files (`.ts` extension)

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.