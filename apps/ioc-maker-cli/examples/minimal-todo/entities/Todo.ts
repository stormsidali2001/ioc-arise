export interface CreateTodoData {
  title: string;
  description?: string;
}

export interface UpdateTodoData {
  title?: string;
  description?: string;
  completed?: boolean;
}

export class Todo {
  public readonly id: string;
  public readonly createdAt: Date;
  public updatedAt: Date;
  private _title: string;
  private _description: string;
  private _completed: boolean;

  constructor(data: CreateTodoData, id?: string) {
    this.id = id || this.generateId();
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this._title = this.validateTitle(data.title);
    this._description = data.description || '';
    this._completed = false;
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

  update(data: UpdateTodoData): void {
    if (data.title !== undefined) {
      this._title = this.validateTitle(data.title);
    }
    if (data.description !== undefined) {
      this._description = data.description;
    }
    if (data.completed !== undefined) {
      this._completed = data.completed;
    }
    this.updatedAt = new Date();
  }

  private validateTitle(title: string): string {
    if (!title || title.trim().length === 0) {
      throw new Error('Title is required');
    }
    if (title.length > 100) {
      throw new Error('Title must be 100 characters or less');
    }
    return title.trim();
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  toJSON(): object {
    return {
      id: this.id,
      title: this._title,
      description: this._description,
      completed: this._completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}