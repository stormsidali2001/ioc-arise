import { GetUserUseCase } from './use-cases/GetUserUseCase';
import { DeleteUserUseCase } from './use-cases/DeleteUserUseCase';
import { CreateUserUseCase } from './use-cases/CreateUserUseCase';
import { GetUserPresenter } from './presenters/GetUserPresenter';
import { DeleteUserPresenter } from './presenters/DeleteUserPresenter';
import { CreateUserPresenter } from './presenters/CreateUserPresenter';
import { UserRepository } from './repositories/UserRepository';

const userRepository = new UserRepository();
const createUserPresenter = new CreateUserPresenter();
const deleteUserPresenter = new DeleteUserPresenter();
const getUserPresenter = new GetUserPresenter();
const createUserUseCase = new CreateUserUseCase(userRepository, createUserPresenter);
const deleteUserUseCase = new DeleteUserUseCase(userRepository, deleteUserPresenter);
const getUserUseCase = new GetUserUseCase(userRepository, getUserPresenter);

export const container = {
  getUserUseCase,
  deleteUserUseCase,
  createUserUseCase,
  getUserPresenter,
  deleteUserPresenter,
  createUserPresenter,
  userRepository,
};

export type Container = typeof container;
