import { UserRepository } from './user/UserRepository';
import { UserController } from './user/UserController';
import { CreateItemUseCase } from './user/CreateItemUseCase';
import { ProductRepository } from './product/ProductRepository';
import { ProductController } from './product/ProductController';
import { CreateItemUseCase } from './product/CreateItemUseCase';

// Lazy initialization variables for singletons
let productController: ProductController | undefined;
let userController: UserController | undefined;
let createItemUseCase: CreateItemUseCase | undefined;
let productRepository: ProductRepository | undefined;
let userRepository: UserRepository | undefined;

// Lazy getter functions for singletons
const getUserRepository = (): UserRepository => {
  if (!userRepository) {
    userRepository = new UserRepository();
  }
  return userRepository;
};
const getProductRepository = (): ProductRepository => {
  if (!productRepository) {
    productRepository = new ProductRepository();
  }
  return productRepository;
};
const getCreateItemUseCase = (): CreateItemUseCase => {
  if (!createItemUseCase) {
    createItemUseCase = new CreateItemUseCase(getProductRepository());
  }
  return createItemUseCase;
};
const getUserController = (): UserController => {
  if (!userController) {
    userController = new UserController(getCreateItemUseCase());
  }
  return userController;
};
const getProductController = (): ProductController => {
  if (!productController) {
    productController = new ProductController(getCreateItemUseCase());
  }
  return productController;
};

export const container = {
  get IUserRepository(): UserRepository {
    return getUserRepository();
  },
  get UserController(): UserController {
    return getUserController();
  },
  get CreateItemUseCase(): CreateItemUseCase {
    return getCreateItemUseCase();
  },
  get IProductRepository(): ProductRepository {
    return getProductRepository();
  },
  get ProductController(): ProductController {
    return getProductController();
  },
  get CreateItemUseCase(): CreateItemUseCase {
    return getCreateItemUseCase();
  },
};

export type Container = typeof container;
