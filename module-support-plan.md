# Module Support Plan for IoC Maker CLI

## Overview

This document outlines the implementation plan for adding optional module support to the IoC Maker CLI. The goal is to allow users to organize their dependencies into logical modules without polluting their code, using a folder-based configuration approach.

## Core Principles

1. **Zero Code Pollution**: Classes remain completely clean with no module-specific annotations
2. **Configuration-Based**: Module organization is defined in `ioc.config.json`
3. **Folder-Based Grouping**: Classes are assigned to modules based on their file paths
4. **Type Safety**: Generated container maintains full type safety
5. **Backward Compatibility**: Works with existing projects without breaking changes

## Configuration Structure

### Updated `ioc.config.json`

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
  "verbose": true,
  "modules": {
    "UserModule": [
      "use-cases",
      "repositories/UserRepository.ts",
      "presenters/*User*"
    ],
    "ProductModule": [
      "product/**",
      "services/ProductService.ts"
    ],
    "CoreModule": [
      "shared/**",
      "utils/**"
    ]
  }
}
```

### Module Configuration Rules

- **Key**: Module name (string)
- **Value**: Array of folder paths, file paths, or glob patterns
- **Pattern Support**: 
  - Exact folder names: `"use-cases"`
  - Specific files: `"repositories/UserRepository.ts"`
  - Glob patterns: `"presenters/*User*"`, `"product/**"`
- **Fallback**: Classes not matching any pattern go to `CoreModule`

## Implementation Plan

### Phase 1: Core Infrastructure

#### 1.1 Update ConfigManager

**File**: `src/utils/configManager.ts`

- Add `modules?: Record<string, string[]>` to `CliOptions` interface
- Validate module configuration in `loadConfigFile()`
- Ensure module names are strings and paths are string arrays

#### 1.2 Create ModuleResolver

**File**: `src/utils/moduleResolver.ts`

```typescript
export class ModuleResolver {
  private moduleConfig: Record<string, string[]>;
  private sourceDirectory: string;

  constructor(moduleConfig: Record<string, string[]>, sourceDirectory: string)
  
  // Core methods:
  getModuleForFile(filePath: string): string | null
  groupClassesByModule(classes: any[]): Map<string, any[]>
  private matchesPattern(filePath: string, pattern: string): boolean
}
```

**Features**:
- Pattern matching using `minimatch` for glob support
- Relative path resolution from source directory
- Support for exact matches, folder matches, and glob patterns
- Fallback to `CoreModule` for unmatched files

#### 1.3 Add Dependencies

**Package**: `minimatch` for glob pattern matching

```bash
pnpm add minimatch
pnpm add -D @types/minimatch
```

### Phase 2: Analysis Integration

#### 2.1 Update Generate Command

**File**: `apps/ioc-maker-cli/src/commands/generate.ts`

- Import and initialize `ModuleResolver`
- Group classes by modules after analysis
- Pass module grouping to container generator
- Add verbose logging for module assignments

#### 2.2 Enhance Analysis Output

- Extend class analysis to include file path information
- Ensure dependency analysis works with module grouping
- Maintain topological sorting within and across modules

### Phase 3: Container Generation

#### 3.1 Update Container Generator

**File**: `src/generator/containerGenerator.ts`

- Add `moduleGroupedClasses` parameter to `generateContainerFile()`
- Implement `generateModularContainer()` function
- Create module-specific sub-containers
- Generate main container that aggregates modules

#### 3.2 Generated Container Structure

```typescript
// Module-specific containers
const userModuleContainer = {
  IUserRepository: userRepository,
  ICreateUserInputPort: createUserUseCase,
  // ... other UserModule dependencies
};

const productModuleContainer = {
  IProductRepository: productRepository,
  IProductService: productService,
  // ... other ProductModule dependencies
};

// Main container
export const container = {
  userModule: userModuleContainer,
  productModule: productModuleContainer,
  core: coreModuleContainer,
};

export type Container = typeof container;
```

### Phase 4: Advanced Features

#### 4.1 Module Dependencies

- Support for inter-module dependencies
- Validation of module dependency cycles
- Automatic module ordering based on dependencies

#### 4.2 Conditional Module Loading

- Optional modules that can be enabled/disabled
- Environment-based module configuration
- Dynamic module registration

#### 4.3 Module Validation

- Ensure all dependencies within a module are satisfied
- Warn about cross-module dependencies
- Validate module configuration patterns

## Usage Examples

### Basic Module Organization

```json
{
  "modules": {
    "UserModule": ["user/**"],
    "ProductModule": ["product/**"],
    "SharedModule": ["shared/**"]
  }
}
```

### Mixed Pattern Matching

```json
{
  "modules": {
    "UserModule": [
      "use-cases/*User*",
      "repositories/UserRepository.ts",
      "presenters/User*"
    ],
    "AuthModule": [
      "auth/**",
      "middleware/AuthMiddleware.ts"
    ]
  }
}
```

### Generated Container Usage

```typescript
import { container } from './container.gen';

// Access module-specific dependencies
const userService = container.userModule.IUserService;
const productService = container.productModule.IProductService;

// Full type safety maintained
const user = userService.getUser('123');
```

## Testing Strategy

### Unit Tests

1. **ModuleResolver Tests**
   - Pattern matching accuracy
   - Glob pattern support
   - Edge cases (empty patterns, invalid paths)

2. **ConfigManager Tests**
   - Module configuration validation
   - Error handling for invalid configurations
   - Backward compatibility

3. **Container Generation Tests**
   - Modular container structure
   - Type safety verification
   - Dependency resolution across modules

### Integration Tests

1. **End-to-End Module Generation**
   - Complete workflow from config to generated container
   - Multiple module scenarios
   - Complex dependency graphs

2. **Backward Compatibility**
   - Existing projects without module configuration
   - Migration from flat to modular structure

## Documentation Updates

### README.md

- Add "Module Support" section
- Update configuration examples
- Include usage examples with modules

### Configuration Reference

- Document module configuration syntax
- Provide pattern matching examples
- Explain module resolution rules

## Migration Guide

### For Existing Projects

1. **Optional Adoption**: Module configuration is completely optional
2. **Gradual Migration**: Can start with simple folder-based modules
3. **No Code Changes**: Existing classes require no modifications

### Migration Steps

1. Add `modules` section to `ioc.config.json`
2. Define initial module groupings
3. Regenerate container
4. Update import statements to use modular structure
5. Refine module organization as needed

## Future Enhancements

### Module Plugins

- Support for module-specific configuration
- Custom module initialization logic
- Module lifecycle hooks

### IDE Integration

- VS Code extension for module visualization
- Auto-completion for module configuration
- Module dependency graph visualization

### Performance Optimizations

- Lazy loading of module containers
- Tree-shaking for unused modules
- Module-level caching strategies

## Implementation Timeline

- **Week 1**: Phase 1 - Core Infrastructure
- **Week 2**: Phase 2 - Analysis Integration
- **Week 3**: Phase 3 - Container Generation
- **Week 4**: Testing and Documentation
- **Week 5**: Advanced Features (Phase 4)

## Success Criteria

1. ✅ Zero impact on existing codebases
2. ✅ Intuitive folder-based module configuration
3. ✅ Type-safe modular container generation
4. ✅ Comprehensive test coverage
5. ✅ Clear documentation and examples
6. ✅ Backward compatibility maintained

---

*This plan provides a roadmap for implementing robust module support while maintaining the simplicity and type safety that makes IoC Maker CLI valuable.*