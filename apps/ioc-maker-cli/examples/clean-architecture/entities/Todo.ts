export interface CreateTodoData {
  title: string;
  description: string;
  userId: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
}

export class Todo {
  constructor(
    public readonly id: string,
    private _title: string,
    private _description: string,
    private _completed: boolean,
    public readonly userId: string,
    public readonly createdAt: Date = new Date(),
    private _updatedAt: Date = new Date()
  ) {
    this.validateTitle(_title);
    this.validateDescription(_description);
    this.validateUserId(userId);
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get completed(): boolean {
    return this._completed;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  // Critical business logic: Title validation
  private validateTitle(title: string): void {
    if (!title || title.trim().length < 3) {
      throw new Error('Title must be at least 3 characters long');
    }
    if (title.trim().length > 200) {
      throw new Error('Title cannot exceed 200 characters');
    }
  }

  // Critical business logic: Description validation
  private validateDescription(description: string): void {
    if (description && description.length > 1000) {
      throw new Error('Description cannot exceed 1000 characters');
    }
  }

  // Critical business logic: User ID validation
  private validateUserId(userId: string): void {
    if (!userId || userId.trim().length === 0) {
      throw new Error('User ID is required');
    }
  }

  // Critical business logic: Update title with validation
  updateTitle(newTitle: string): void {
    this.validateTitle(newTitle);
    this._title = newTitle;
    this.touch();
  }

  // Critical business logic: Update description with validation
  updateDescription(newDescription: string): void {
    this.validateDescription(newDescription);
    this._description = newDescription;
    this.touch();
  }

  // Critical business logic: Mark as completed
  markAsCompleted(): void {
    if (this._completed) {
      throw new Error('Todo is already completed');
    }
    this._completed = true;
    this.touch();
  }

  // Critical business logic: Mark as incomplete
  markAsIncomplete(): void {
    if (!this._completed) {
      throw new Error('Todo is already incomplete');
    }
    this._completed = false;
    this.touch();
  }

  // Critical business logic: Toggle completion status
  toggleCompletion(): void {
    this._completed = !this._completed;
    this.touch();
  }

  // Critical business logic: Check if todo is overdue (if it has a due date)
  isOverdue(dueDate?: Date): boolean {
    if (!dueDate) return false;
    return !this._completed && new Date() > dueDate;
  }

  // Critical business logic: Get todo priority based on age and completion
  getPriority(): 'high' | 'medium' | 'low' {
    if (this._completed) return 'low';
    
    const daysSinceCreated = Math.floor(
      (Date.now() - this.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysSinceCreated > 7) return 'high';
    if (daysSinceCreated > 3) return 'medium';
    return 'low';
  }

  // Critical business logic: Check if todo belongs to user
  belongsToUser(userId: string): boolean {
    return this.userId === userId;
  }

  // Critical business logic: Get summary for display
  getSummary(maxLength: number = 50): string {
    const summary = this._title.length > maxLength 
      ? this._title.substring(0, maxLength) + '...'
      : this._title;
    return `${this._completed ? '✓' : '○'} ${summary}`;
  }

  // Update the updatedAt timestamp
  private touch(): void {
    this._updatedAt = new Date();
  }

  // Factory method for creating new todos
  static create(data: CreateTodoData): Todo {
    const id = crypto.randomUUID();
    return new Todo(id, data.title, data.description, false, data.userId);
  }

  // Update todo with partial data
  update(data: UpdateTodoData): void {
    if (data.title !== undefined) {
      this.updateTitle(data.title);
    }
    if (data.description !== undefined) {
      this.updateDescription(data.description);
    }
    if (data.completed !== undefined) {
      if (data.completed && !this._completed) {
        this.markAsCompleted();
      } else if (!data.completed && this._completed) {
        this.markAsIncomplete();
      }
    }
  }

  // Convert to plain object for serialization
  toJSON(): object {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      completed: this.completed,
      userId: this.userId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}