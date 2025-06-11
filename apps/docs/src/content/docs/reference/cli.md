---
title: CLI Reference
description: Complete reference for all IoC Arise CLI commands and options
---

## Installation

```bash
# Install locally in project
pnpm add -D ioc-arise

# Install globally
pnpm add -g ioc-arise

# Use with npx (no installation)
npx ioc-arise generate
```

## Commands

### `generate`

Generates IoC container from TypeScript classes.

```bash
ioc-arise generate [options]
```

#### Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--source <dir>` | `-s` | string | `src` | Source directory to scan |
| `--output <file>` | `-o` | string | `container.gen.ts` | Output file path |
| `--interface <pattern>` | `-i` | string | - | Interface name pattern (regex) |
| `--exclude <patterns...>` | `-e` | string[] | `[]` | Exclude file patterns |
| `--check-cycles` | - | boolean | `false` | Only check circular dependencies |
| `--verbose` | - | boolean | `false` | Enable verbose logging |
| `--help` | `-h` | - | - | Show help information |

#### Examples

```bash
# Basic usage
ioc-arise generate

# Specify source and output
ioc-arise generate --source src --output dist/container.gen.ts

# Filter by interface pattern
ioc-arise generate --interface "I[A-Z].*"

# Exclude test files
ioc-arise generate --exclude "**/*.test.ts" "**/*.spec.ts"

# Check for circular dependencies only
ioc-arise generate --check-cycles

# Verbose output
ioc-arise generate --verbose

# Combined options
ioc-arise generate \
  --source src \
  --output container.gen.ts \
  --interface "I[A-Z].*" \
  --exclude "**/*.test.ts" \
  --verbose
```

### `analyze`

Analyzes project and shows detected classes without generating files.

```bash
ioc-arise analyze [options]
```

#### Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--source <dir>` | `-s` | string | `src` | Source directory to scan |
| `--interface <pattern>` | `-i` | string | - | Interface name pattern (regex) |
| `--exclude <patterns...>` | `-e` | string[] | `[]` | Exclude file patterns |
| `--help` | `-h` | - | - | Show help information |

#### Examples

```bash
# Analyze project
ioc-arise analyze

# Analyze specific directory
ioc-arise analyze --source src/modules

# Filter by interface pattern
ioc-arise analyze --interface "Service$"

# Exclude specific files
ioc-arise analyze --exclude "**/*.test.ts"
```

#### Output Format

The analyze command outputs detailed information about detected classes:

```
🔍 Analyzing directory: /path/to/src

Detected Classes:
==================

📁 Module: UserModule
  ├── UserService (implements IUserService)
  │   └── Dependencies: IUserRepository, IEmailService
  ├── UserRepository (implements IUserRepository)
  │   └── Dependencies: IDatabaseConnection
  └── CreateUserUseCase (implements ICreateUserInputPort)
      └── Dependencies: IUserRepository, ICreateUserOutputPort

📁 Module: EmailModule
  └── EmailService (implements IEmailService)
      └── Dependencies: IEmailProvider

Dependency Graph:
=================
UserService -> UserRepository, EmailService
UserRepository -> DatabaseConnection
CreateUserUseCase -> UserRepository, CreateUserPresenter
EmailService -> EmailProvider

✅ No circular dependencies detected
📊 Total classes: 5
📊 Total dependencies: 8
```

## Global Options

These options are available for all commands:

| Option | Description |
|--------|-------------|
| `--help` | Show help information |
| `--version` | Show version number |

## Configuration File Priority

Options are resolved in the following priority order (highest to lowest):

1. **CLI arguments** (highest priority)
2. **Configuration file** (`ioc.config.json`)
3. **Default values** (lowest priority)

### Example Priority Resolution

```json
// ioc.config.json
{
  "source": "src",
  "output": "container.gen.ts",
  "verbose": true
}
```

```bash
# CLI overrides config file
ioc-arise generate --source lib --verbose false

# Result:
# source: "lib" (from CLI)
# output: "container.gen.ts" (from config)
# verbose: false (from CLI)
```

## Exit Codes

IoC Arise uses standard exit codes:

| Code | Meaning | Description |
|------|---------|-------------|
| `0` | Success | Command completed successfully |
| `1` | Error | General error (invalid arguments, file not found, etc.) |
| `2` | Circular Dependencies | Circular dependencies detected (when using `--check-cycles`) |
| `3` | Configuration Error | Invalid configuration file or options |
| `4` | Analysis Error | Error during code analysis |
| `5` | Generation Error | Error during container generation |

### Using Exit Codes in Scripts

```bash
#!/bin/bash

# Check for circular dependencies
ioc-arise generate --check-cycles
if [ $? -eq 2 ]; then
  echo "❌ Circular dependencies detected!"
  exit 1
fi

# Generate container
ioc-arise generate
if [ $? -eq 0 ]; then
  echo "✅ Container generated successfully"
else
  echo "❌ Failed to generate container"
  exit 1
fi
```

## Environment Variables

IoC Arise respects these environment variables:

| Variable | Description | Default |
|----------|-------------|----------|
| `IOC_ARISE_CONFIG` | Path to configuration file | `ioc.config.json` |
| `IOC_ARISE_VERBOSE` | Enable verbose logging | `false` |
| `NODE_ENV` | Environment (affects default settings) | - |

### Example Usage

```bash
# Use custom config file
IOC_ARISE_CONFIG=./configs/production.json ioc-arise generate

# Enable verbose mode via environment
IOC_ARISE_VERBOSE=true ioc-arise generate

# Combine with other environment variables
NODE_ENV=production IOC_ARISE_CONFIG=./prod.config.json ioc-arise generate
```

## Pattern Matching

### Interface Patterns

The `--interface` option accepts regular expressions:

```bash
# Interfaces starting with 'I' followed by uppercase letter
ioc-arise generate --interface "I[A-Z].*"

# Interfaces ending with 'Service' or 'Repository'
ioc-arise generate --interface "(Service|Repository)$"

# Interfaces containing 'User'
ioc-arise generate --interface ".*User.*"

# Multiple patterns (OR logic)
ioc-arise generate --interface "I[A-Z].*|.*Service$"
```

### Exclude Patterns

The `--exclude` option accepts glob patterns:

```bash
# Exclude test files
ioc-arise generate --exclude "**/*.test.ts" "**/*.spec.ts"

# Exclude specific directories
ioc-arise generate --exclude "**/node_modules/**" "**/dist/**"

# Exclude by file name pattern
ioc-arise generate --exclude "**/*Mock*" "**/*Stub*"

# Complex exclusions
ioc-arise generate --exclude \
  "**/*.test.ts" \
  "**/*.spec.ts" \
  "**/mocks/**" \
  "**/fixtures/**" \
  "**/*.d.ts"
```

## Debugging and Troubleshooting

### Verbose Mode

Enable verbose mode to see detailed information:

```bash
ioc-arise generate --verbose
```

Verbose output includes:
- Configuration resolution
- File discovery process
- Class analysis details
- Dependency resolution steps
- Module organization
- Generation process

### Common Error Messages

#### Source Directory Not Found

```
❌ Source directory does not exist: /path/to/src
```

**Solution**: Check the path and ensure the directory exists.

#### No Classes Found

```
⚠️ No classes implementing interfaces found in: /path/to/src
```

**Solutions**:
- Check your interface pattern with `--interface`
- Verify your classes implement interfaces
- Use `analyze` command to see what's detected

#### Circular Dependencies

```
❌ Circular dependencies detected:
   UserService -> OrderService -> UserService
```

**Solutions**:
- Refactor to remove circular dependencies
- Extract shared logic into separate services
- Use event-driven architecture

#### Invalid Configuration

```
❌ Module configuration errors:
   - Module 'UserModule' has no matching files
   - Pattern 'invalid/**' in module 'TestModule' is invalid
```

**Solutions**:
- Check your glob patterns
- Verify file paths exist
- Use `analyze` command to test patterns

### Debug Commands

```bash
# Check what files are being analyzed
ioc-arise analyze --verbose

# Test interface patterns
ioc-arise analyze --interface "I[A-Z].*" --verbose

# Check for circular dependencies only
ioc-arise generate --check-cycles --verbose

# Test exclude patterns
ioc-arise analyze --exclude "**/*.test.ts" --verbose
```

## Integration Examples

### Package.json Scripts

```json
{
  "scripts": {
    "ioc:generate": "ioc-arise generate",
    "ioc:analyze": "ioc-arise analyze",
    "ioc:check": "ioc-arise generate --check-cycles",
    "prebuild": "npm run ioc:generate",
    "build": "tsc",
    "pretest": "npm run ioc:check",
    "test": "jest"
  }
}
```

### Makefile Integration

```makefile
.PHONY: ioc-generate ioc-check build test

ioc-generate:
	ioc-arise generate --verbose

ioc-check:
	ioc-arise generate --check-cycles

build: ioc-generate
	tsc

test: ioc-check
	jest

dev: ioc-generate
	ts-node src/index.ts
```

### Docker Integration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm install

COPY . .

# Generate IoC container during build
RUN npx ioc-arise generate
RUN npm run build

CMD ["npm", "start"]
```

### CI/CD Integration

```yaml
# GitHub Actions
name: Build and Test
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Check IoC configuration
        run: npx ioc-arise generate --check-cycles
      
      - name: Generate container
        run: npx ioc-arise generate --verbose
      
      - name: Build
        run: npm run build
      
      - name: Test
        run: npm test
```

## Performance Considerations

### Large Projects

For large projects, consider:

```bash
# Use specific interface patterns
ioc-arise generate --interface "I[A-Z][a-zA-Z]*Service"

# Exclude unnecessary files
ioc-arise generate --exclude \
  "**/*.test.ts" \
  "**/*.spec.ts" \
  "**/node_modules/**" \
  "**/dist/**"

# Use modules to organize dependencies
# (configure in ioc.config.json)
```

### Memory Usage

Monitor memory usage for very large codebases:

```bash
# Check memory usage
time ioc-arise generate --verbose

# Use Node.js memory options if needed
node --max-old-space-size=4096 $(which ioc-arise) generate
```

## Version Information

```bash
# Check version
ioc-arise --version

# Check help
ioc-arise --help
ioc-arise generate --help
ioc-arise analyze --help
```

## Next Steps

- Learn about [Configuration Options](/reference/configuration/) in detail
- Explore [Examples](/guides/examples/) for common usage patterns
- Check out [Best Practices](/guides/best-practices/) for optimal usage