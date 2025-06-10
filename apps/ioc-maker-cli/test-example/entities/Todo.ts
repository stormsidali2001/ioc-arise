export interface Todo {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

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