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

### Key Components

**Core Analysis Engine** (`src/analyser/`):
- `ProjectAnalyzer` - Main orchestrator that analyzes TypeScript projects
- `ClassAnalyzer` - Uses AST-grep to parse TypeScript files and extract class information
- `DependencyResolver` - Detects and validates dependencies, including circular dependency detection
- `FileDiscovery` - Discovers TypeScript files in project directories

**Container Generation** (`src/generator/`):
- `ContainerGeneratorFactory` - Creates appropriate generator based on configuration
- `BaseContainerGenerator` - Generates single-file containers for simple projects
- `ModularContainerGenerator` - Generates modular containers with separate module files
- Uses path injection utilities to handle different import patterns

**Configuration Management** (`src/utils/configManager.ts`):
- Reads `ioc.config.json` files from project directories
- Supports modular configuration with module groupings
- CLI options override config file settings

**CLI Commands** (`src/commands/`):
- `generate` - Main command for generating IoC containers
- `analyze` - Analyzes projects and reports dependency information
- `visualize` - Provides dependency visualization

### Project Structure
- **Monorepo**: Uses pnpm workspaces with Turbo for build orchestration
- **Main CLI Package**: `apps/ioc-maker-cli` - The core CLI tool
- **Documentation**: `apps/docs` - Astro-based documentation site
- **Examples**: Comprehensive example projects in `apps/ioc-maker-cli/examples/`

### Testing Strategy
- Uses Vitest for unit testing
- Integration tests via example projects
- AST parsing tests for TypeScript analysis
- Coverage reporting available

### Key Dependencies
- `@ast-grep/napi` - Fast TypeScript AST parsing (Rust-based)
- `commander` - CLI framework
- `glob` - File pattern matching
- `minimatch` - Advanced glob pattern matching

The tool generates type-safe dependency injection containers by analyzing TypeScript code structure without requiring decorators or annotations.