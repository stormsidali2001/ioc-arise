---
title: Configuration Reference
description: Complete reference for all IoC Arise configuration options
---

## Configuration File

IoC Arise uses `ioc.config.json` for configuration. Place this file in your source directory.

### Basic Configuration

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

## Configuration Options

### `source`

- **Type**: `string`
- **Default**: `"src"`
- **Description**: Source directory to scan for TypeScript files

```json
{
  "source": "src"
}
```

**Examples**:
```json
// Relative path
{ "source": "src" }

// Absolute path
{ "source": "/path/to/project/src" }

// Different directory
{ "source": "lib" }
```

### `output`

- **Type**: `string`
- **Default**: `"container.gen.ts"`
- **Description**: Output file path for generated container

```json
{
  "output": "container.gen.ts"
}
```

**Examples**:
```json
// Default output
{ "output": "container.gen.ts" }

// Custom filename
{ "output": "ioc-container.ts" }

// Different directory
{ "output": "generated/container.ts" }

// Absolute path
{ "output": "/path/to/output/container.gen.ts" }
```

### `interface`

- **Type**: `string`
- **Default**: `undefined` (matches all interfaces)
- **Description**: Regular expression pattern to match interface names

```json
{
  "interface": "I[A-Z].*"
}
```

**Examples**:
```json
// Interfaces starting with 'I' followed by uppercase
{ "interface": "I[A-Z].*" }

// Interfaces ending with 'Service' or 'Repository'
{ "interface": "(Service|Repository)$" }

// Interfaces containing 'User'
{ "interface": ".*User.*" }

// Multiple patterns
{ "interface": "I[A-Z].*|.*Service$|.*Repository$" }

// All interfaces (default)
{ "interface": ".*" }
```

### `exclude`

- **Type**: `string[]`
- **Default**: `[]`
- **Description**: Array of glob patterns to exclude files

```json
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

**Examples**:
```json
// Test files
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/__tests__/**"
  ]
}

// Build artifacts
{
  "exclude": [
    "**/dist/**",
    "**/build/**",
    "**/*.d.ts"
  ]
}

// Development files
{
  "exclude": [
    "**/mocks/**",
    "**/fixtures/**",
    "**/dev-tools/**"
  ]
}

// Combined exclusions
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/node_modules/**",
    "**/dist/**",
    "**/*.d.ts",
    "**/mocks/**"
  ]
}
```

### `verbose`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Enable verbose logging output

```json
{
  "verbose": true
}
```

**Output when enabled**:
```
📋 Using config file: /path/to/ioc.config.json
🔍 Searching for TypeScript files with pattern: src/**/*.ts
📁 Found 25 TypeScript files
🔍 Analyzing classes...
📊 Found 8 classes implementing interfaces
🏗️ Generating container...
✅ Container generated successfully: container.gen.ts
```

### `checkCycles`

- **Type**: `boolean`
- **Default**: `false`
- **Description**: Only check for circular dependencies without generating

```json
{
  "checkCycles": true
}
```

**Behavior**:
- When `true`: Only analyzes dependencies and reports cycles
- When `false`: Performs full analysis and generation



### `modules`

- **Type**: `Record<string, string[]>`
- **Default**: `{}`
- **Description**: Module configuration for organizing dependencies

```json
{
  "modules": {
    "UserModule": [
      "use-cases/*User*",
      "repositories/UserRepository.ts",
      "presenters/*User*"
    ],
    "ProductModule": [
      "use-cases/*Product*",
      "repositories/ProductRepository.ts",
      "services/*Product*"
    ]
  }
}
```

**Module Pattern Examples**:
```json
{
  "modules": {
    // Wildcard patterns
    "UserModule": [
      "**/User*",           // Files starting with "User"
      "**/*User*",          // Files containing "User"
      "user/**/*"           // All files in user directory
    ],
    
    // Specific files
    "CoreModule": [
      "repositories/UserRepository.ts",
      "services/EmailService.ts"
    ],
    
    // Directory patterns
    "DomainModule": [
      "entities/**/*",
      "value-objects/**/*"
    ],
    
    // Mixed patterns
    "FeatureModule": [
      "features/auth/**/*",
      "use-cases/*Auth*",
      "services/AuthService.ts"
    ]
  }
}
```

## Advanced Configuration

### Environment-Specific Configurations

Create different configurations for different environments:

```json
// ioc.config.development.json
{
  "source": "src",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "verbose": true,
  "modules": {
    "DevModule": ["dev-tools/**/*"]
  }
}
```

```json
// ioc.config.production.json
{
  "source": "src",
  "output": "dist/container.gen.js",
  "interface": "I[A-Z].*",
  "verbose": false,
  "exclude": [
    "dev-tools/**/*",
    "**/*.test.ts"
  ]
}
```

```json
// ioc.config.testing.json
{
  "source": "src",
  "output": "test-container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": [
    "**/*.prod.ts"
  ],
  "modules": {
    "TestModule": ["**/*Mock*", "**/*Stub*"]
  }
}
```

### Using Environment-Specific Configs

```bash
# Use specific config file
IOC_ARISE_CONFIG=ioc.config.production.json ioc-arise generate

# Or copy config based on environment
cp ioc.config.${NODE_ENV}.json ioc.config.json
ioc-arise generate
```

### Complex Module Organization

```json
{
  "modules": {
    // Clean Architecture layers
    "DomainLayer": [
      "entities/**/*",
      "value-objects/**/*",
      "domain-services/**/*"
    ],
    "ApplicationLayer": [
      "use-cases/**/*",
      "application-services/**/*",
      "ports/**/*"
    ],
    "InfrastructureLayer": [
      "repositories/**/*",
      "external-services/**/*",
      "adapters/**/*"
    ],
    "PresentationLayer": [
      "presenters/**/*",
      "controllers/**/*",
      "view-models/**/*"
    ],
    
    // Feature-based modules
    "AuthenticationFeature": [
      "features/auth/**/*",
      "**/*Auth*",
      "**/*Login*",
      "**/*Token*"
    ],
    "UserManagementFeature": [
      "features/users/**/*",
      "**/*User*"
    ],
    
    // Shared modules
    "SharedKernel": [
      "shared/**/*",
      "common/**/*",
      "utils/**/*"
    ]
  }
}
```

## Configuration Validation

IoC Arise validates your configuration and provides helpful error messages:

### Module Validation Errors

```bash
❌ Module configuration errors:
   - Module 'UserModule' has no matching files
   - Pattern 'invalid/**' in module 'TestModule' is invalid
   - Duplicate class 'UserService' found in multiple modules
```

### Pattern Validation

```bash
❌ Invalid interface pattern: '[invalid'
💡 Use valid regex patterns like 'I[A-Z].*' or '.*Service$'
```

### Path Validation

```bash
❌ Source directory does not exist: /invalid/path
❌ Output directory is not writable: /readonly/path
```

## Configuration Schema

Complete TypeScript interface for configuration:

```typescript
interface IoCConfig {
  /** Source directory to scan */
  source?: string;
  
  /** Output file path */
  output?: string;
  
  /** Interface name pattern (regex) */
  interface?: string;
  
  /** File patterns to exclude */
  exclude?: string[];
  
  /** Enable verbose logging */
  verbose?: boolean;
  
  /** Only check circular dependencies */
  checkCycles?: boolean;
  
  /** Module configuration */
  modules?: Record<string, string[]>;
}
```

## Configuration Examples

### Minimal Configuration

```json
{
  "source": "src"
}
```

### Basic Project Configuration

```json
{
  "source": "src",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": ["**/*.test.ts"]
}
```

### Large Project Configuration

```json
{
  "source": "src",
  "output": "generated/container.gen.ts",
  "interface": "I[A-Z][a-zA-Z]*(?:Service|Repository|UseCase|Presenter)$",
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.d.ts",
    "**/mocks/**",
    "**/fixtures/**",
    "**/dev-tools/**"
  ],
  "verbose": true,
  "modules": {
    "CoreDomain": [
      "entities/**/*",
      "value-objects/**/*"
    ],
    "UserBoundedContext": [
      "contexts/user/**/*",
      "**/*User*"
    ],
    "OrderBoundedContext": [
      "contexts/order/**/*",
      "**/*Order*"
    ],
    "SharedInfrastructure": [
      "infrastructure/shared/**/*",
      "adapters/shared/**/*"
    ]
  }
}
```

### Microservice Configuration

```json
{
  "source": "src",
  "output": "container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": [
    "**/*.test.ts",
    "**/integration-tests/**"
  ],
  "modules": {
    "ApiModule": [
      "api/**/*",
      "controllers/**/*",
      "middleware/**/*"
    ],
    "BusinessLogicModule": [
      "services/**/*",
      "use-cases/**/*"
    ],
    "DataAccessModule": [
      "repositories/**/*",
      "data-access/**/*"
    ],
    "ExternalIntegrationsModule": [
      "integrations/**/*",
      "external-apis/**/*"
    ]
  }
}
```

### Testing Configuration

```json
{
  "source": "src",
  "output": "test-container.gen.ts",
  "interface": "I[A-Z].*",
  "exclude": [
    "**/*.prod.ts",
    "**/production/**"
  ],
  "modules": {
    "TestDoubles": [
      "**/*Mock*",
      "**/*Stub*",
      "**/*Fake*"
    ],
    "TestUtilities": [
      "test-utils/**/*",
      "testing/**/*"
    ]
  }
}
```

## Configuration Best Practices

### 1. Use Specific Patterns

```json
// ✅ Good: Specific interface pattern
{
  "interface": "I[A-Z][a-zA-Z]*(?:Service|Repository)$"
}

// ❌ Avoid: Too broad
{
  "interface": ".*"
}
```

### 2. Exclude Unnecessary Files

```json
// ✅ Good: Comprehensive exclusions
{
  "exclude": [
    "**/*.test.ts",
    "**/*.spec.ts",
    "**/*.d.ts",
    "**/node_modules/**",
    "**/dist/**",
    "**/mocks/**"
  ]
}
```

### 3. Organize Modules Logically

```json
// ✅ Good: Logical module boundaries
{
  "modules": {
    "UserDomain": ["user/**/*", "**/*User*"],
    "OrderDomain": ["order/**/*", "**/*Order*"]
  }
}

// ❌ Avoid: Random groupings
{
  "modules": {
    "Module1": ["UserService.ts", "OrderRepository.ts"]
  }
}
```

### 4. Environment-Specific Settings

```json
// Development
{
  "verbose": true,
  "modules": {
    "DevTools": ["dev-tools/**/*"]
  }
}

// Production
{
  "verbose": false,
  "exclude": ["dev-tools/**/*"]
}
```

## Troubleshooting Configuration

### Test Your Configuration

```bash
# Test configuration without generating
ioc-arise analyze --verbose

# Check for configuration errors
ioc-arise generate --check-cycles
```

### Common Issues

1. **No files found**: Check your `source` path and `exclude` patterns
2. **No classes detected**: Verify your `interface` pattern
3. **Module errors**: Test your glob patterns
4. **Path issues**: Use absolute paths when in doubt

### Debug Configuration

```json
{
  "verbose": true,
  "source": "src",
  "interface": ".*",
  "exclude": []
}
```

This configuration will show maximum information to help debug issues.

## Next Steps

- Learn about [CLI Reference](/reference/cli/) for command-line usage
- Explore [Module Organization](/guides/modules/) for advanced module patterns
- Check out [Best Practices](/guides/best-practices/) for optimal configuration