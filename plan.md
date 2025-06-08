# IoC Container Generator Plan

## 🧠 Goal (Theory)

You want to:
- Automatically detect all classes implementing a specific interface (like Service, Repository, etc.)
- Parse their constructor dependencies
- Topologically sort classes based on dependency order
- Generate a `container.gen.ts` file that:
  - Instantiates all services in order
  - Exports a single type-safe container object
  - Provides full IDE autocompletion and type checking
- Avoid decorators or runtime registration. Everything is static and type-safe.

## ⚙️ Step-by-Step Plan (Implementation)

### ✅ Step 1: Setup Project

Create a new CLI project:
```
my-di-cli/
├── src/
│   ├── analyzer.ts         # AST logic to extract class + constructor info
│   ├── generator.ts        # Outputs the container.gen.ts file
│   └── index.ts            # CLI entry point
├── tsconfig.json
├── package.json
```

Install dependencies:
```bash
npm install @ast-grep/napi
npm install -D typescript ts-node
```

### ✅ Step 2: Analyze Classes (`src/analyzer.ts`)

Use `ast-grep` to scan all `.ts` files.

Find classes matching:
```ts
class $C implements $I { ... }
```

Extract:
- className
- filePath
- constructor dependencies (types)

Store as:
```ts
type ClassInfo = {
  name: string;
  filePath: string;
  dependencies: string[];
};
```

### ✅ Step 3: Topological Sort & Generate Code (`src/generator.ts`)

- Import all classes
- For each class:
  - Instantiate with constructor dependencies
  - Store them in camelCase variables
- Export a single object:

```ts
export const container = {
  userService,
  userRepository,
  ...
};

export type Container = typeof container;
```

Ensure services are initialized in dependency order using topological sort.

### ✅ Step 4: CLI Entrypoint (`src/index.ts`)

Run analysis:
```ts
const classes = await analyzeProject("src");
```

Generate file:
```ts
generateContainerFile(classes, "src/container.gen.ts");
```

Log success:
```ts
console.log(`✅ container.gen.ts generated`);
```

### ✅ Step 5: Sample Generated Output

```ts
import { UserRepository } from './services/UserRepository';
import { UserService } from './services/UserService';

const userRepository = new UserRepository();
const userService = new UserService(userRepository);

export const container = {
  userRepository,
  userService,
};

export type Container = typeof container;
```

## 🧱 Optional Improvements

- Add CLI flags for:
  - Interface name pattern (e.g. `--match=Service`)
  - Output file path
- Detect and warn about circular dependencies
- Support interfaces without the `implements` keyword (by naming convention)