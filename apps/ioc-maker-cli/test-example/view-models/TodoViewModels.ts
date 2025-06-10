// View Models for Todo operations

export interface TodoViewModel {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  userId: string;
}

export interface CreateTodoViewModel {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string;
  successMessage: string;
  todo: TodoViewModel | null;
}

export interface GetTodoViewModel {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isNotFound: boolean;
  errorMessage: string;
  todo: TodoViewModel | null;
}

export interface GetTodosByUserViewModel {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string;
  todos: TodoViewModel[];
}

export interface UpdateTodoViewModel {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isNotFound: boolean;
  errorMessage: string;
  successMessage: string;
  todo: TodoViewModel | null;
}

export interface DeleteTodoViewModel {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isNotFound: boolean;
  errorMessage: string;
  successMessage: string;
}