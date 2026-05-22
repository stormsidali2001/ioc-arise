# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Building and Development
- `pnpm build` - Build all packages using Turbo
- `pnpm dev` - Start development mode for all packages
- `pnpm lint` - Run linting across all packages
- `pnpm check-types` - Run TypeScript type checking
- `pnpm format` - Format code with Prettier

### CLI Package Development (apps/ioc-maker-cli)
- `cd apps/ioc-maker-cli && pnpm build` - Build the CLI tool
- `cd apps/ioc-maker-cli && pnpm test` - Run Vitest tests
- `cd apps/ioc-maker-cli && pnpm test:run` - Run tests once
- `cd apps/ioc-maker-cli && pnpm test:coverage` - Run tests with coverage
- `cd apps/ioc-maker-cli && pnpm dev` - Run CLI in development mode with ts-node

### Testing CLI with Examples
- `cd apps/ioc-maker-cli && pnpm test1:generate` - Test with clean architecture example
- `cd apps/ioc-maker-cli && pnpm test2:generate` - Test with circular dependencies modules
- `cd apps/ioc-maker-cli && pnpm test3:generate` - Test with circular dependencies classes
- `cd apps/ioc-maker-cli && pnpm test4:generate` - Test with minimal todo example
- `cd apps/ioc-maker-cli && pnpm test5:generate` - Test with simple modules example

### Documentation Development (apps/docs)
- `cd apps/docs && pnpm dev` - Start Astro development server
- `cd apps/docs && pnpm build` - Build documentation site

## Architecture Overview

This is a TypeScript IoC container generator CLI tool built as a monorepo using pnpm workspaces and Turbo.

### Layer Structure (`apps/ioc-maker-cli/src/`)

The CLI follows a strict four-layer architecture. Inner layers never import from outer layers.

**`domain/`** — Pure value types with no dependencies (`ClassInfo`, `FactoryInfo`, `ValueInfo`, `ParsedFile`, etc.)

**`analysis/`** — Pure semantic analysis: no I/O, no AST library. Receives `ParsedFile[]` + a global token inventory and returns typed domain objects.
- `ClassAnalyzer` — classifies raw class data into `ClassInfo[]` (interface-implementing, abstract-extending, standalone)
- `FactoryAnalyzer` — classifies factory functions into `FactoryInfo[]`
- `ValueAnalyzer` — classifies value constants into `ValueInfo[]`
- `DependencyResolver` — builds dependency graph, detects class-level cycles
- `ModuleDependencyResolver` — detects module-level cycles (DAG check)

**`application/`** — Use-cases that orchestrate the pipeline via constructor-injected dependencies.
- `AnalyzeProjectUseCase` — discover → parse → token collection → classify → validate
- `GenerateContainerUseCase` — run the generator pipeline → write files
- `DetectCyclesUseCase` — class cycles + module cycles
- `ValidateOutputUseCase` — ts-morph diagnostics on generated files
- `IFileDiscovery` / `ICodeWriter` — the two layer-boundary interfaces

**`infrastructure/`** — Concrete I/O and third-party integrations.
- `parser/TsMorphTypeParser` — replaces old ast-grep god-class; uses ts-morph typed AST API. `parseContent()` accepts in-memory source for unit testing without filesystem.
- `generator/` — five stateless code-gen components: `RegistrationPlanner`, `ImportCollector`, `ContainerCodePrinter`, `ModuleCodePrinter`, `TypeDeclarationPrinter`
- `discovery/GlobFileDiscovery` — implements `IFileDiscovery` using glob
- `writer/FsCodeWriter` — implements `ICodeWriter` using `fs.writeFile`

**`commands/`** — Thin CLI wiring: parse options, call `buildContainer()`, invoke use-cases.

**`container.ts`** — `buildContainer()` factory that wires the full dependency graph for the CLI.

### Configuration Management (`src/utils/configManager.ts`)
- Reads `ioc.config.json` files from project directories
- Supports modular configuration with module groupings
- CLI options override config file settings

### Project Structure
- **Monorepo**: Uses pnpm workspaces with Turbo for build orchestration
- **Main CLI Package**: `apps/ioc-maker-cli` - The core CLI tool
- **Documentation**: `apps/docs` - Astro-based documentation site
- **Examples**: Comprehensive example projects in `apps/ioc-maker-cli/examples/`

### Testing Strategy
- Uses Vitest for unit testing
- `TsMorphTypeParser` has 16 unit tests using in-memory ts-morph Project (no filesystem)
- Integration tests via example projects (20 examples covering all features)
- Coverage reporting available

### Key Dependencies
- `ts-morph` - TypeScript compiler API wrapper for AST parsing
- `commander` - CLI framework
- `glob` - File pattern matching
- `minimatch` - Advanced glob pattern matching

The tool generates type-safe dependency injection containers by analyzing TypeScript code structure without requiring decorators or annotations.