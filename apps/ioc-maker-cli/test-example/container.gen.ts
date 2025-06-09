import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { UserRepository } from './repositories/UserRepository';
import { GetUserPresenter } from './presenters/GetUserPresenter';
import { DeleteUserPresenter } from './presenters/DeleteUserPresenter';
import { CreateUserPresenter } from './presenters/CreateUserPresenter';

// Lazy loading setup for transient dependencies
const userRepositoryFactory = (): UserRepository => new UserRepository();
const deleteUserPresenterFactory = (): DeleteUserPresenter => new DeleteUserPresenter();

// Eager singleton instantiation
const createUserPresenter = new CreateUserPresenter();
const getUserPresenter = new GetUserPresenter();
const createUserUseCase = new CreateUserUseCase(userRepositoryFactory(), createUserPresenter);
const deleteUserUseCase = new DeleteUserUseCase(userRepositoryFactory(), deleteUserPresenterFactory());
const getUserUseCase = new GetUserUseCase(userRepositoryFactory(), getUserPresenter);

export const container = {
  IGetUserInputPort: getUserUseCase,
  IDeleteUserInputPort: deleteUserUseCase,
  ICreateUserInputPort: createUserUseCase,
  IGetUserOutputPort: getUserPresenter,
  ICreateUserOutputPort: createUserPresenter,
  get IUserRepository(): UserRepository {
    return userRepositoryFactory();
  },
  get IDeleteUserOutputPort(): DeleteUserPresenter {
    return deleteUserPresenterFactory();
  },
};

export type Container = typeof container;
