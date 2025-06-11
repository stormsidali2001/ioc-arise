---
title: Getting Started
description: Learn how to install and use IoC Arise in your TypeScript project
---

## Installation

IoC Arise is a command-line tool that analyzes your TypeScript code and generates type-safe IoC containers.

### Prerequisites

- Node.js 16 or higher
- TypeScript project
- pnpm, npm, or yarn package manager

### Install IoC Arise

```bash
# Using pnpm (recommended)
pnpm add -D ioc-arise

# Using npm
npm install --save-dev ioc-arise

# Using yarn
yarn add -D ioc-arise
```

### Global Installation (Optional)

For convenience, you can install IoC Arise globally:

```bash
# Using pnpm
pnpm add -g ioc-arise

# Using npm
npm install -g ioc-arise
```

## Basic Usage

### 1. Prepare Your Code

IoC Arise works by analyzing classes that implement interfaces. Make sure your code follows this pattern:

```typescript
// Define interfaces
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
}

export interface IUserService {
  getUser(id: string): Promise<User>;
  createUser(userData: CreateUserData): Promise<User>;
}

// Implement classes
export class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User | null> {
    // Implementation
  }
  
  async save(user: User): Promise<void> {
    // Implementation
  }
}

export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}
  
  async getUser(id: string): Promise<User> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error('User not found');
    return user;
  }
  
  async createUser(userData: CreateUserData): Promise<User> {
    // Implementation
  }
}
```

### 2. Generate Container

Run IoC Arise to analyze your code and generate the container:

```bash
# Basic generation
ioc-arise generate

# Specify source directory
ioc-arise generate --source src

# Specify output file
ioc-arise generate --source src --output src/container.gen.ts
```

### 3. Use Generated Container

IoC Arise generates a typed container with all your dependencies:

```typescript
// container.gen.ts (generated)
export const container = {
  userRepository: new UserRepository(),
  userService: new UserService(container.userRepository)
};

export type Container = typeof container;
```

Use it in your application:

```typescript
import { container } from './container.gen';

// All dependencies are properly instantiated and typed
const userService = container.userService;
const user = await userService.getUser('123');
```

## Configuration

### Using Configuration File

Create an `ioc.config.json` file in your source directory:

```json
{
  "source": "src",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ],
  "verbose": true
}
```

### Configuration Options

| Option | Description | Default |
|--------|-------------|---------|
| `source` | Source directory to scan | `src` |
| `output` | Output file path | `container.gen.ts` |
| `interface` | Interface name pattern (regex) | - |
| `exclude` | File patterns to exclude | `[]` |
| `verbose` | Enable verbose logging | `false` |
| `checkCycles` | Only check circular dependencies | `false` |
| `modules` | Module configuration | `{}` |

### CLI Options

All configuration options can be overridden via CLI:

```bash
ioc-arise generate \
  --source src \
  --output dist/container.gen.ts \
  --interface "I[A-Z].*" \
  --exclude "**/*.test.ts" "**/*.spec.ts" \
  --verbose
```

## Interface Patterns

Use the `interface` option to filter which interfaces to include:

```bash
# Only interfaces starting with 'I' followed by uppercase letter
ioc-arise generate --interface "I[A-Z].*"

# Only Service and Repository interfaces
ioc-arise generate --interface "(Service|Repository)$"

# All interfaces (default behavior)
ioc-arise generate
```

## Analyzing Without Generating

Use the `analyze` command to inspect your project without generating files:

```bash
# Analyze project structure
ioc-arise analyze --source src

# Check for circular dependencies
ioc-arise generate --check-cycles
```

## Next Steps

- Learn about [Module Organization](/guides/modules/) for complex projects
- Explore [Configuration Options](/reference/configuration/) in detail
- Check out [Examples](/guides/examples/) for common patterns
- Read about [Best Practices](/guides/best-practices/) for optimal usage