import { UserRepository } from './user/UserRepository';
import { UserController } from './user/UserController';
import { CreateItemUseCase } from './user/CreateItemUseCase';
import { ProductRepository } from './product/ProductRepository';
import { ProductController } from './product/ProductController';
import { CreateItemUseCase as ProductCreateItemUseCase } from './product/CreateItemUseCase';
import { OrderRepository } from './order/OrderRepository';
import { OrderController } from './order/OrderController';
import { CreateItemUseCase as OrderCreateItemUseCase } from './order/CreateItemUseCase';

function createCoreModuleContainer() {

  let orderCreateItemUseCase: OrderCreateItemUseCase | undefined;
  let orderController: OrderController | undefined;
  let orderRepository: OrderRepository | undefined;
  let productCreateItemUseCase: ProductCreateItemUseCase | undefined;
  let productController: ProductController | undefined;
  let productRepository: ProductRepository | undefined;
  let createItemUseCase: CreateItemUseCase | undefined;
  let userController: UserController | undefined;
  let userRepository: UserRepository | undefined;

  const getOrderCreateItemUseCase = (): OrderCreateItemUseCase => {
    if (!orderCreateItemUseCase) {
      orderCreateItemUseCase = new OrderCreateItemUseCase(getOrderRepository());
    }
    return orderCreateItemUseCase;
  };
  const getOrderController = (): OrderController => {
    if (!orderController) {
      orderController = new OrderController(getOrderCreateItemUseCase());
    }
    return orderController;
  };
  const getOrderRepository = (): OrderRepository => {
    if (!orderRepository) {
      orderRepository = new OrderRepository();
    }
    return orderRepository;
  };
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
        },
        get ProductRepository(): ProductRepository {
          return getProductRepository();
        },
        get ProductController(): ProductController {
          return getProductController();
        },
        get ProductCreateItemUseCase(): ProductCreateItemUseCase {
          return getProductCreateItemUseCase();
        },
        get OrderRepository(): OrderRepository {
          return getOrderRepository();
        },
        get OrderController(): OrderController {
          return getOrderController();
        },
        get OrderCreateItemUseCase(): OrderCreateItemUseCase {
          return getOrderCreateItemUseCase();
        }
  };
}

const coreModuleContainer = createCoreModuleContainer();

export const container = {
  coreModule: coreModuleContainer
};

export type Container = typeof container;
