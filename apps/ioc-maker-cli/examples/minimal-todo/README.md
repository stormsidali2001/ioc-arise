# Minimal Todo List Example

This example demonstrates a simple todo list application using IoC Arise with:

- Repository pattern with two implementations (in-memory and JSON file)
- Service layer for business logic
- Simple entity model

## Structure

- `entities/` - Todo entity
- `repositories/` - Repository interfaces and implementations
- `services/` - Business logic services
- `ioc.config.json` - IoC configuration
- `container.gen.ts` - Generated container

## Running the Example

1. Generate the container:
   ```bash
   npx ioc-arise generate
   ```

2. Use the container in your application:
   ```typescript
   import { container } from './container.gen';
   
   const todoService = container.ITodoService;
   await todoService.createTodo({ title: 'Learn IoC Arise', description: 'Study dependency injection' });
   ```