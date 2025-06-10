import { Todo, CreateTodoData, UpdateTodoData } from './Todo';

export interface CreateUserData {
  email: string;
  name: string;
}

// User Aggregate Root - manages Todo entities
export class User {
  private _todos: Map<string, Todo> = new Map();

  constructor(
    public readonly id: string,
    private _email: string,
    private _name: string,
    public readonly createdAt: Date = new Date()
  ) {
    this.validateEmail(_email);
    this.validateName(_name);
  }

  get email(): string {
    return this._email;
  }

  get name(): string {
    return this._name;
  }

  get todos(): Todo[] {
    return Array.from(this._todos.values());
  }

  // Critical business logic: Email validation
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  // Critical business logic: Name validation
  private validateName(name: string): void {
    if (!name || name.trim().length < 2) {
      throw new Error('Name must be at least 2 characters long');
    }
    if (name.trim().length > 100) {
      throw new Error('Name cannot exceed 100 characters');
    }
  }

  // Critical business logic: Update email with validation
  updateEmail(newEmail: string): void {
    this.validateEmail(newEmail);
    this._email = newEmail;
  }

  // Critical business logic: Update name with validation
  updateName(newName: string): void {
    this.validateName(newName);
    this._name = newName;
  }

  // Critical business logic: Get display name
  getDisplayName(): string {
    return this._name.trim();
  }

  // Critical business logic: Check if user has valid contact info
  hasValidContactInfo(): boolean {
    return this.email.length > 0 && this.name.trim().length > 0;
  }

  // Aggregate business logic: Add a new todo
  addTodo(todoData: CreateTodoData): Todo {
    if (todoData.userId !== this.id) {
      throw new Error('Todo must belong to this user');
    }

    // Business rule: User cannot have more than 100 todos
    if (this._todos.size >= 100) {
      throw new Error('User cannot have more than 100 todos');
    }

    // Business rule: User cannot have duplicate todo titles
    const existingTodo = Array.from(this._todos.values())
      .find(todo => todo.title.toLowerCase() === todoData.title.toLowerCase());
    if (existingTodo) {
      throw new Error('User already has a todo with this title');
    }

    const todo = Todo.create(todoData);
    this._todos.set(todo.id, todo);
    return todo;
  }

  // Aggregate business logic: Get a specific todo
  getTodo(todoId: string): Todo | null {
    return this._todos.get(todoId) || null;
  }

  // Aggregate business logic: Update a todo
  updateTodo(todoId: string, updateData: UpdateTodoData): Todo {
    const todo = this._todos.get(todoId);
    if (!todo) {
      throw new Error('Todo not found');
    }

    // Business rule: Check for duplicate titles when updating
    if (updateData.title) {
      const existingTodo = Array.from(this._todos.values())
        .find(t => t.id !== todoId && t.title.toLowerCase() === updateData.title!.toLowerCase());
      if (existingTodo) {
        throw new Error('User already has a todo with this title');
      }
    }

    todo.update(updateData);
    return todo;
  }

  // Aggregate business logic: Remove a todo
  removeTodo(todoId: string): boolean {
    return this._todos.delete(todoId);
  }

  // Aggregate business logic: Get completed todos
  getCompletedTodos(): Todo[] {
    return Array.from(this._todos.values()).filter(todo => todo.completed);
  }

  // Aggregate business logic: Get pending todos
  getPendingTodos(): Todo[] {
    return Array.from(this._todos.values()).filter(todo => !todo.completed);
  }

  // Aggregate business logic: Get todos by priority
  getTodosByPriority(priority: 'high' | 'medium' | 'low'): Todo[] {
    return Array.from(this._todos.values()).filter(todo => todo.getPriority() === priority);
  }

  // Aggregate business logic: Mark all todos as completed
  completeAllTodos(): void {
    for (const todo of Array.from(this._todos.values())) {
      if (!todo.completed) {
        todo.markAsCompleted();
      }
    }
  }

  // Aggregate business logic: Get todo statistics
  getTodoStats(): { total: number; completed: number; pending: number; highPriority: number } {
    const todos = Array.from(this._todos.values());
    return {
      total: todos.length,
      completed: todos.filter(t => t.completed).length,
      pending: todos.filter(t => !t.completed).length,
      highPriority: todos.filter(t => t.getPriority() === 'high').length
    };
  }

  // Aggregate business logic: Check if user is productive (has completed todos)
  isProductive(): boolean {
    return this.getCompletedTodos().length > 0;
  }

  // Factory method for creating new users
  static create(data: CreateUserData): User {
    const id = crypto.randomUUID();
    return new User(id, data.email, data.name);
  }

  // Load existing todos into the aggregate (for repository loading)
  loadTodos(todos: Todo[]): void {
    this._todos.clear();
    for (const todo of todos) {
      if (todo.userId !== this.id) {
        throw new Error('Cannot load todo that does not belong to this user');
      }
      this._todos.set(todo.id, todo);
    }
  }

  // Convert to plain object for serialization
  toJSON(): object {
    return {
      id: this.id,
      email: this.email,
      name: this.name,
      createdAt: this.createdAt,
      todos: this.todos.map(todo => todo.toJSON())
    };
  }
}