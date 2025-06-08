export interface CreateUserViewModel {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  errorMessage: string;
  successMessage: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface GetUserViewModel {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isNotFound: boolean;
  errorMessage: string;
  user: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export interface DeleteUserViewModel {
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  isNotFound: boolean;
  errorMessage: string;
  successMessage: string;
}