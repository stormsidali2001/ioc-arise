# IoC Arise

> **A lightweight, type-safe dependency injection framework for TypeScript. Zero decorators, zero coupling, zero overhead.**

A production-ready dependency injection container framework that works standalone or with automated code generation. The core `@notjustcoders/di-container` package provides a powerful, type-safe DI runtime (~4KB), while the optional CLI tool automates container setup by analyzing your code and generating configuration.

[![npm version](https://badge.fury.io/js/@notjustcoders%2Fdi-container.svg)](https://www.npmjs.com/package/@notjustcoders/di-container)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Documentation](https://img.shields.io/badge/docs-ioc--arise.notjustcoders.com-blue)](https://ioc-arise.notjustcoders.com)

## Features

- 🔒 **100% Type Safe** - Full TypeScript support with compile-time validation
- 🪶 **Lightweight** - Only ~4KB with zero dependencies
- 🚫 **Zero Decorators** - Pure TypeScript, no framework coupling
- 💎 **Value Objects** - Inject plain objects and functional services
- 🏭 **Factory Functions** - Custom instance creation logic
- 🏗️ **Class Injection** - Traditional class-based dependency injection
- 📐 **Abstract Classes** - First-class support for abstract base classes
- 🏗️ **Modular Architecture** - Built-in module system
- 🔄 **Lifecycle Management** - Singleton and Transient scopes
- 🌐 **Universal Runtime** - Works in Node.js, Browser, Deno, Bun, Edge Workers

## Table of Contents

- [Installation](#installation)
- [How It Works](#how-it-works)
  - [Step 1: Write Your Code](#step-1-write-your-code-pure-typescript-no-decorators)
  - [Step 2: Generate Your Container](#step-2-generate-your-container)
  - [Step 3: All Your Code is Automatically Registered](#step-3-all-your-code-is-automatically-registered-)
  - [Step 4: Use It with Full Type Safety](#step-4-use-it-with-full-type-safety)
- [Documentation](#documentation)
- [Links](#links)
- [License](#license)

## Installation

```bash
npm install @notjustcoders/di-container
```

## How It Works

### Step 1: Write Your Code (Pure TypeScript, No Decorators!)

Write your classes, interfaces, value objects, and factory functions in pure TypeScript:

**Value Objects:**

```typescript
/**
 * @value
 */
const config: IConfig = { apiUrl: 'https://api.example.com' };

/**
 * @value
 */
const userService: IUserService = {
  getUser: (id: string) => Promise.resolve({ id, name: 'User' })
};
```

**Factory Functions (Separate Parameters):**

```typescript
/**
 * @factory
 */
function createService(repo: IRepo1, config: IConfig) {
  return (userId: string) => {
    if (config.environment === 'prod') {
      return new ProductionService(repo, userId);
    }
    return new DevelopmentService(repo, userId);
  };
}
```

**Factory Functions (Context Object):**

```typescript
/**
 * @factory
 */
function createTodoUseCase(
  context: { userRepo: IUserRepository, todoRepo: ITodoRepository }
) {
  return (userId: string, title: string): void => {
    const user = context.userRepo.getUser(userId);
    console.log(`Creating todo for ${user}`);
    context.todoRepo.saveTodo(title);
  };
}
```

**Classes:**

```typescript
interface IService1 {
  getData(id: string): Promise<any>;
}

interface IRepo1 {
  findById(id: string): Promise<any>;
}

class Repo1 implements IRepo1 {
  async findById(id: string) { /* ... */ }
}

class Service1 implements IService1 {
  constructor(private repo: IRepo1) {}
  async getData(id: string) { /* ... */ }
}
```

**Abstract Classes:**

```typescript
abstract class BaseRepo {
  abstract findById(id: string): Promise<any>;
}

class Repo1 extends BaseRepo {
  async findById(id: string) { /* ... */ }
}
```

### Step 2: Generate Your Container

Run the CLI command to auto-generate, or type the container registration code manually:

```bash
npx @notjustcoders/ioc-arise generate
```

### Step 3: All Your Code is Registered! ✨

**If you used the CLI**, it analyzes your code and generates two files. **If you typed it manually**, you'll have the same structure:

**`container.gen.d.ts`** - Type-safe registry interface:

```typescript
// container.gen.d.ts (auto-generated)
import type { IConfig } from './config';
import type { IUserService } from './userService';
import type { IService1 } from './services/IService1';
import type { IRepo1 } from './repositories/IRepo1';
import type { BaseRepo } from './repositories/BaseRepo';

export interface ContainerRegistry {
  'IConfig': IConfig;
  'IUserService': IUserService;
  'IService1': IService1;
  'IRepo1': IRepo1;
  'BaseRepo': BaseRepo;
}
```

**`container.gen.ts`** - Container with all registrations:

```typescript
// container.gen.ts (auto-generated)
import { Container, Lifecycle } from '@notjustcoders/di-container';
import type { ContainerRegistry } from './container.gen.d';
import { config } from './config';
import { userService } from './userService';
import { createService } from './createService';
import { Repo1, Service1 } from './classes';

export const container = new Container<ContainerRegistry>();

// All your value objects, factories, and classes are registered!
container.register('IConfig', { useValue: config });
container.register('IUserService', { useValue: userService });
container.register('IService1', { 
  useFactory: createService, 
  dependencies: ['IRepo1', 'IConfig'] 
});
container.register('IService1', { 
  useClass: Service1, 
  dependencies: ['IRepo1'],
  lifecycle: Lifecycle.Singleton 
});
// ... and more
```

### Step 4: Use It with Full Type Safety

```typescript
import { container } from './container.gen';

const service = container.resolve('IService1');
//    ^? IService1 - Full IntelliSense!
```

## Documentation

For comprehensive documentation and examples, visit **[ioc-arise.notjustcoders.com](https://ioc-arise.notjustcoders.com)**

## Links

- **Container Package**: [@notjustcoders/di-container](https://www.npmjs.com/package/@notjustcoders/di-container)
- **CLI Tool**: [@notjustcoders/ioc-arise](https://www.npmjs.com/package/@notjustcoders/ioc-arise)
- **GitHub**: [spithacode/ioc-maker](https://github.com/spithacode/ioc-maker)

## License

MIT © [NotJustCoders](https://notjustcoders.com)
