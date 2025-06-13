import { UserRepository } from './user/UserRepository';
import { UserController } from './user/UserController';
import { CreateItemUseCase } from './user/CreateItemUseCase';
import { ProductRepository } from './product/ProductRepository';
import { ProductController } from './product/ProductController';
import { CreateItemUseCase as ProductCreateItemUseCase } from './product/CreateItemUseCase';

function createUserModuleContainer() {

  let createItemUseCase: CreateItemUseCase | undefined;
  let userController: UserController | undefined;
  let userRepository: UserRepository | undefined;

  const getCreateItemUseCase = (): CreateItemUseCase => {
    if (!createItemUseCase) {
      createItemUseCase = new CreateItemUseCase(getUserRepository());
    }
    return createItemUseCase;
  };
  const getUserController = (): UserController => {
    if (!userController) {
      userController = new UserController(getCreateItemUseCase());
    }
    return userController;
  };
  const getUserRepository = (): UserRepository => {
    if (!userRepository) {
      userRepository = new UserRepository();
    }
    return userRepository;
  };

  return {
        get UserRepository(): UserRepository {
          return getUserRepository();
        },
        get UserController(): UserController {
          return getUserController();
        },
        get CreateItemUseCase(): CreateItemUseCase {
          return getCreateItemUseCase();
        }
  };
}

function createProductModuleContainer() {

  let productCreateItemUseCase: ProductCreateItemUseCase | undefined;
  let productController: ProductController | undefined;
  let productRepository: ProductRepository | undefined;

  const getProductCreateItemUseCase = (): ProductCreateItemUseCase => {
    if (!productCreateItemUseCase) {
      productCreateItemUseCase = new ProductCreateItemUseCase(getProductRepository());
    }
    return productCreateItemUseCase;
  };
  const getProductController = (): ProductController => {
    if (!productController) {
      productController = new ProductController(getProductCreateItemUseCase());
    }
    return productController;
  };
  const getProductRepository = (): ProductRepository => {
    if (!productRepository) {
      productRepository = new ProductRepository();
    }
    return productRepository;
  };

  return {
        get ProductRepository(): ProductRepository {
          return getProductRepository();
        },
        get ProductController(): ProductController {
          return getProductController();
        },
        get ProductCreateItemUseCase(): ProductCreateItemUseCase {
          return getProductCreateItemUseCase();
        }
  };
}

const userModuleContainer = createUserModuleContainer();
const productModuleContainer = createProductModuleContainer();

export const container = {
  userModule: userModuleContainer,  productModule: productModuleContainer
};

export type Container = typeof container;
