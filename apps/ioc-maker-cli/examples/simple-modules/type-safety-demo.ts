import { container } from './container.gen';

// Type-safe resolution with string tokens
// No manual casting needed! TypeScript infers the correct type automatically

const userService = container.resolve('IUserService'); 
// Type: IUserService (autocomplete available!)

const userRepo = container.resolve('IUserRepository');
// Type: IUserRepository (autocomplete available!)

const todoService = container.resolve('ITodoService');
// Type: ITodoService (autocomplete available!)

// Try to resolve an invalid token - TypeScript will show an error!
// const invalid = container.resolve('NonExistentService');
// Error: Argument of type '"NonExistentService"' is not assignable to parameter of type 'keyof ContainerRegistry'

// You can also use the services with full type safety
async function demo() {
  const users = await userService.getAllUsers();
  console.log('Users:', users);
  
  const todos = await todoService.getAllTodos();
  console.log('Todos:', todos);
}

demo();

