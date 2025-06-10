import { IUserRepository } from './IUserRepository';
import { User } from '../entities/User';
import { Todo } from '../entities/Todo';

export class UserRepository implements IUserRepository {
  private users: Map<string, User> = new Map();
  // Store todos separately to simulate database relationships
  private todos: Map<string, Todo> = new Map();

  constructor() {
    // Initialize with some mock data
    const mockUser = new User(
      '1',
      'john@example.com',
      'John Doe',
      new Date('2024-01-01')
    );
    
    // Create some mock todos for the user
    const mockTodo1 = new Todo(
      'todo-1',
      'Learn Clean Architecture',
      'Study the principles of clean architecture and implement a sample project',
      false,
      '1',
      new Date('2024-01-01'),
      new Date('2024-01-01')
    );
    
    const mockTodo2 = new Todo(
      'todo-2',
      'Implement DDD Patterns',
      'Apply Domain-Driven Design patterns in the project',
      true,
      '1',
      new Date('2024-01-02'),
      new Date('2024-01-03')
    );
    
    // Store todos separately
    this.todos.set(mockTodo1.id, mockTodo1);
    this.todos.set(mockTodo2.id, mockTodo2);
    
    // Load todos into the user aggregate
    mockUser.loadTodos([mockTodo1, mockTodo2]);
    
    this.users.set(mockUser.id, mockUser);
  }

  async findById(id: string): Promise<User | null> {
    const user = this.users.get(id);
    if (!user) return null;
    
    // Load todos for the user aggregate
    const userTodos = Array.from(this.todos.values())
      .filter(todo => todo.userId === id);
    user.loadTodos(userTodos);
    
    return user;
  }

  async save(user: User): Promise<void> {
    // Save the user
    this.users.set(user.id, user);
    
    // Save all todos from the aggregate
    for (const todo of user.todos) {
      this.todos.set(todo.id, todo);
    }
    
    console.log('User aggregate saved to repository:', {
      user: { id: user.id, email: user.email, name: user.name },
      todosCount: user.todos.length
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of Array.from(this.users.values())) {
      if (user.email === email) {
        // Load todos for the user aggregate
        const userTodos = Array.from(this.todos.values())
          .filter(todo => todo.userId === user.id);
        user.loadTodos(userTodos);
        return user;
      }
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    // Delete associated todos
    const userTodoIds = Array.from(this.todos.keys()).filter(todoId => {
      const todo = this.todos.get(todoId);
      return todo?.userId === id;
    });
    
    userTodoIds.forEach(todoId => {
      this.todos.delete(todoId);
    });
    
    this.users.delete(id);
  }

  async findAll(): Promise<User[]> {
    const users = Array.from(this.users.values());
    
    // Load todos for each user
    for (const user of users) {
      const userTodos = Array.from(this.todos.values())
        .filter(todo => todo.userId === user.id);
      user.loadTodos(userTodos);
    }
    
    return users;
  }
}