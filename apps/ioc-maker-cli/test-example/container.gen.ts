import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { UserRepository } from './repositories/UserRepository';
import { GetUserPresenter } from './presenters/GetUserPresenter';
import { DeleteUserPresenter } from './presenters/DeleteUserPresenter';
import { CreateUserPresenter } from './presenters/CreateUserPresenter';

// Lazy loading setup for transient dependencies
const getUserPresenterFactory = (): GetUserPresenter => new GetUserPresenter();
const deleteUserPresenterFactory = (): DeleteUserPresenter => new DeleteUserPresenter();
const createUserPresenterFactory = (): CreateUserPresenter => new CreateUserPresenter();

// Eager singleton instantiation
const userRepository = new UserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository, new OutputPort());
const deleteUserUseCase = new DeleteUserUseCase(userRepository, deleteUserPresenterFactory());
const getUserUseCase = new GetUserUseCase(userRepository, getUserPresenterFactory());

export const container = {
  IGetUserInputPort: getUserUseCase,
  IDeleteUserInputPort: deleteUserUseCase,
  ICreateUserInputPort: createUserUseCase,
  IUserRepository: userRepository,
  get IGetUserOutputPort(): GetUserPresenter {
    return getUserPresenterFactory();
  },
  get IDeleteUserOutputPort(): DeleteUserPresenter {
    return deleteUserPresenterFactory();
  },
  get ICreateUserOutputPort(): CreateUserPresenter {
    return createUserPresenterFactory();
  },
};

export type Container = typeof container;
