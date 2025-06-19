# Scope Example

This example demonstrates how to use JSDoc annotations to control the lifecycle of your dependencies in IoC Arise.

## What's Inside

- **Singleton Services** - Services that are created once and reused
- **Transient Services** - Services that are created fresh for each request
- **Mixed Dependencies** - How singleton and transient services work together

## Scope Types

### @scope singleton
Creates a single instance that is reused across the entire application lifecycle.

### @scope transient
Creates a new instance every time the service is requested.

## Project Structure

```
scope-example/
├── services/
│   ├── ISingletonService.ts     # Interface for singleton service
│   ├── SingletonService.ts      # Singleton implementation
│   ├── ITransientService.ts     # Interface for transient service
│   ├── TransientService.ts      # Transient implementation
│   └── MixedService.ts          # Service using both scopes
├── ioc.config.json              # IoC configuration
├── container.gen.ts             # Generated container
└── demo.ts                      # Demo script
```

## Running the Example

1. Generate the container:
   ```bash
   npx @notjustcoders/ioc-arise generate
   ```

2. Run the demo:
   ```bash
   npx tsx demo.ts
   ```

## Key Concepts

- **Singleton Pattern**: Perfect for stateful services like caches, loggers, or configuration managers
- **Transient Pattern**: Ideal for stateless services or when you need fresh state for each operation
- **Mixed Usage**: How to combine both patterns effectively in your application architecture