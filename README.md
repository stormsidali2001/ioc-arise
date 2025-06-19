# IoC Arise

> **Arise type-safe IoC containers from your code. Zero overhead, zero coupling.**

A powerful TypeScript IoC container generator CLI tool that automatically creates type-safe dependency injection containers from your existing code. No decorators, no annotations, no manual wiring required.

[![npm version](https://badge.fury.io/js/@notjustcoders%2Fioc-arise.svg)](https://www.npmjs.com/package/@notjustcoders/ioc-arise)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-ioc--arise.notjustcoders.com-blue)](https://ioc-arise.notjustcoders.com)

## ✨ Features

- 🚀 **Zero Configuration** - No decorators, annotations, or manual wiring required
- 🔒 **100% Type Safe** - Generated containers are fully typed with compile-time validation
- ⚡ **Blazing Fast** - Powered by AST-grep (built with Rust) for lightning-fast analysis
- 🎯 **Smart Dependency Analysis** - Automatically detects circular dependencies and missing implementations
- 🏗️ **Modular Architecture** - Organize code into logical modules with cross-module dependency support
- 🔄 **Zero Coupling** - Your business logic stays clean and framework-agnostic
- 📊 **Advanced Features** - Supports scopes (singleton/transient), name collision handling, and more

## 🚀 Quick Start

### Installation

```bash
# Install globally
npm install -g @notjustcoders/ioc-arise

# Or use with your package manager
pnpm add -D @notjustcoders/ioc-arise
```

### Basic Usage

1. **Create your interfaces and classes:**

```typescript
// IUserService.ts
export interface IUserService {
  createUser(name: string, email: string): Promise<User>;
}

// UserService.ts
export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}
  
  async createUser(name: string, email: string): Promise<User> {
    // Implementation
  }
}
```

2. **Generate your container:**

```bash
npx ioc-arise generate
```

3. **Use the generated container:**

```typescript
import { container } from './container.gen';

const userService = container.coreModule.UserService;
const user = await userService.createUser('John Doe', 'john@example.com');
```

## 📖 Documentation

For comprehensive documentation, examples, and advanced usage patterns, visit:

**🌐 [ioc-arise.notjustcoders.com](https://ioc-arise.notjustcoders.com)**

### Key Documentation Sections:

- [**Getting Started**](https://ioc-arise.notjustcoders.com/guides/getting-started/) - Quick setup guide
- [**Examples**](https://ioc-arise.notjustcoders.com/examples/) - Real-world usage patterns
- [**CLI Reference**](https://ioc-arise.notjustcoders.com/reference/cli-reference/) - Complete command reference
- [**Configuration**](https://ioc-arise.notjustcoders.com/reference/configuration/) - Advanced configuration options

## 🏗️ Project Structure

This is a monorepo containing:

```
ioc-maker/
├── apps/
│   ├── docs/                    # Documentation website (Astro + Starlight)
│   └── ioc-maker-cli/           # CLI tool package
├── packages/
│   ├── eslint-config/           # Shared ESLint configuration
│   └── typescript-config/       # Shared TypeScript configuration
└── examples/                    # Example projects
```

## 🛠️ Development

### Prerequisites

- Node.js >= 18
- pnpm (recommended package manager)

### Setup

```bash
# Clone the repository
git clone https://github.com/spithacode/ioc-maker.git
cd ioc-maker

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start development
pnpm dev
```

### Available Scripts

- `pnpm build` - Build all packages
- `pnpm dev` - Start development mode
- `pnpm lint` - Run linting
- `pnpm format` - Format code with Prettier
- `pnpm check-types` - Type checking

### Working with the CLI

```bash
# Navigate to CLI package
cd apps/ioc-maker-cli

# Build the CLI
pnpm build

# Test with examples
pnpm test1:generate  # Clean architecture example
pnpm test2:generate  # Circular dependencies example
pnpm test3:generate  # Simple modules example
# ... more test scripts available
```

### Working with Documentation

```bash
# Navigate to docs
cd apps/docs

# Start development server
pnpm dev

# Build for production
pnpm build
```

## 📝 Examples

The repository includes comprehensive examples demonstrating various patterns:

- **Minimal Todo** - Basic repository pattern
- **Simple Modules** - Cross-module dependencies
- **Clean Architecture** - Advanced architectural patterns
- **Use Cases** - Classes without interfaces
- **Name Collision** - Handling duplicate class names
- **Circular Dependencies** - Error detection and handling
- **Scope Management** - Singleton vs Transient lifecycles

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.


## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔗 Links

- **Documentation**: [ioc-arise.notjustcoders.com](https://ioc-arise.notjustcoders.com)
- **npm Package**: [@notjustcoders/ioc-arise](https://www.npmjs.com/package/@notjustcoders/ioc-arise)
- **GitHub**: [spithacode/ioc-maker](https://github.com/spithacode/ioc-maker)
- **Website**: [NotJustCoders](https://notjustcoders.com)

## 🙏 Acknowledgments

- Built with [AST-grep](https://ast-grep.github.io/) for fast TypeScript parsing
- Documentation powered by [Astro](https://astro.build/) and [Starlight](https://starlight.astro.build/)
- Monorepo managed with [Turbo](https://turbo.build/)

---

**Made with ❤️ by the NotJustCoders team**