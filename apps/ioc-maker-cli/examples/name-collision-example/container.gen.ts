import { UserRepository } from './user/UserRepository';
import { UserController } from './user/UserController';
import { UpdateItemUseCase } from './user/UpdateItemUseCase';
import { ListItemsUseCase } from './user/ListItemsUseCase';
import { GetItemUseCase } from './user/GetItemUseCase';
import { DeleteItemUseCase } from './user/DeleteItemUseCase';
import { CreateItemUseCase } from './user/CreateItemUseCase';
import { UpdateItemUseCase as ProductUpdateItemUseCase } from './product/UpdateItemUseCase';
import { ProductRepository } from './product/ProductRepository';
import { ProductController } from './product/ProductController';
import { ListItemsUseCase as ProductListItemsUseCase } from './product/ListItemsUseCase';
import { GetItemUseCase as ProductGetItemUseCase } from './product/GetItemUseCase';
import { DeleteItemUseCase as ProductDeleteItemUseCase } from './product/DeleteItemUseCase';
import { CreateItemUseCase as ProductCreateItemUseCase } from './product/CreateItemUseCase';
import { UpdateItemUseCase as OrderUpdateItemUseCase } from './order/UpdateItemUseCase';
import { OrderRepository } from './order/OrderRepository';
import { OrderController } from './order/OrderController';
import { ListItemsUseCase as OrderListItemsUseCase } from './order/ListItemsUseCase';
import { GetItemUseCase as OrderGetItemUseCase } from './order/GetItemUseCase';
import { DeleteItemUseCase as OrderDeleteItemUseCase } from './order/DeleteItemUseCase';
import { CreateItemUseCase as OrderCreateItemUseCase } from './order/CreateItemUseCase';

function createCoreModuleContainer() {

  let orderCreateItemUseCase: OrderCreateItemUseCase | undefined;
  let orderDeleteItemUseCase: OrderDeleteItemUseCase | undefined;
  let orderGetItemUseCase: OrderGetItemUseCase | undefined;
  let orderListItemsUseCase: OrderListItemsUseCase | undefined;
  let orderController: OrderController | undefined;
  let orderUpdateItemUseCase: OrderUpdateItemUseCase | undefined;
  let orderRepository: OrderRepository | undefined;
  let productCreateItemUseCase: ProductCreateItemUseCase | undefined;
  let productDeleteItemUseCase: ProductDeleteItemUseCase | undefined;
  let productGetItemUseCase: ProductGetItemUseCase | undefined;
  let productListItemsUseCase: ProductListItemsUseCase | undefined;
  let productController: ProductController | undefined;
  let productUpdateItemUseCase: ProductUpdateItemUseCase | undefined;
  let productRepository: ProductRepository | undefined;
  let createItemUseCase: CreateItemUseCase | undefined;
  let deleteItemUseCase: DeleteItemUseCase | undefined;
  let getItemUseCase: GetItemUseCase | undefined;
  let listItemsUseCase: ListItemsUseCase | undefined;
  let updateItemUseCase: UpdateItemUseCase | undefined;
  let userController: UserController | undefined;
  let userRepository: UserRepository | undefined;

  const getOrderCreateItemUseCase = (): OrderCreateItemUseCase => {
    if (!orderCreateItemUseCase) {
      orderCreateItemUseCase = new OrderCreateItemUseCase(getOrderRepository());
    }
    return orderCreateItemUseCase;
  };
  const getOrderDeleteItemUseCase = (): OrderDeleteItemUseCase => {
    if (!orderDeleteItemUseCase) {
      orderDeleteItemUseCase = new OrderDeleteItemUseCase(getOrderRepository());
    }
    return orderDeleteItemUseCase;
  };
  const getOrderGetItemUseCase = (): OrderGetItemUseCase => {
    if (!orderGetItemUseCase) {
      orderGetItemUseCase = new OrderGetItemUseCase(getOrderRepository());
    }
    return orderGetItemUseCase;
  };
  const getOrderListItemsUseCase = (): OrderListItemsUseCase => {
    if (!orderListItemsUseCase) {
      orderListItemsUseCase = new OrderListItemsUseCase(getOrderRepository());
    }
    return orderListItemsUseCase;
  };
  const getOrderController = (): OrderController => {
    if (!orderController) {
      orderController = new OrderController(getOrderCreateItemUseCase(), getOrderUpdateItemUseCase(), getOrderDeleteItemUseCase(), getOrderGetItemUseCase(), getOrderListItemsUseCase());
    }
    return orderController;
  };
  const getOrderUpdateItemUseCase = (): OrderUpdateItemUseCase => {
    if (!orderUpdateItemUseCase) {
      orderUpdateItemUseCase = new OrderUpdateItemUseCase(getOrderRepository());
    }
    return orderUpdateItemUseCase;
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
  const getProductDeleteItemUseCase = (): ProductDeleteItemUseCase => {
    if (!productDeleteItemUseCase) {
      productDeleteItemUseCase = new ProductDeleteItemUseCase(getProductRepository());
    }
    return productDeleteItemUseCase;
  };
  const getProductGetItemUseCase = (): ProductGetItemUseCase => {
    if (!productGetItemUseCase) {
      productGetItemUseCase = new ProductGetItemUseCase(getProductRepository());
    }
    return productGetItemUseCase;
  };
  const getProductListItemsUseCase = (): ProductListItemsUseCase => {
    if (!productListItemsUseCase) {
      productListItemsUseCase = new ProductListItemsUseCase(getProductRepository());
    }
    return productListItemsUseCase;
  };
  const getProductController = (): ProductController => {
    if (!productController) {
      productController = new ProductController(getProductCreateItemUseCase(), getProductUpdateItemUseCase(), getProductDeleteItemUseCase(), getProductGetItemUseCase(), getProductListItemsUseCase());
    }
    return productController;
  };
  const getProductUpdateItemUseCase = (): ProductUpdateItemUseCase => {
    if (!productUpdateItemUseCase) {
      productUpdateItemUseCase = new ProductUpdateItemUseCase(getProductRepository());
    }
    return productUpdateItemUseCase;
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
  const getDeleteItemUseCase = (): DeleteItemUseCase => {
    if (!deleteItemUseCase) {
      deleteItemUseCase = new DeleteItemUseCase(getUserRepository());
    }
    return deleteItemUseCase;
  };
  const getGetItemUseCase = (): GetItemUseCase => {
    if (!getItemUseCase) {
      getItemUseCase = new GetItemUseCase(getUserRepository());
    }
    return getItemUseCase;
  };
  const getListItemsUseCase = (): ListItemsUseCase => {
    if (!listItemsUseCase) {
      listItemsUseCase = new ListItemsUseCase(getUserRepository());
    }
    return listItemsUseCase;
  };
  const getUpdateItemUseCase = (): UpdateItemUseCase => {
    if (!updateItemUseCase) {
      updateItemUseCase = new UpdateItemUseCase(getUserRepository());
    }
    return updateItemUseCase;
  };
  const getUserController = (): UserController => {
    if (!userController) {
      userController = new UserController(getCreateItemUseCase(), getUpdateItemUseCase(), getDeleteItemUseCase(), getGetItemUseCase(), getListItemsUseCase());
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
        get IUserRepository(): UserRepository {
          return getUserRepository();
        },
        get UserRepository(): UserRepository {
          return getUserRepository();
        },
        get UserController(): UserController {
          return getUserController();
        },
        get UpdateItemUseCase(): UpdateItemUseCase {
          return getUpdateItemUseCase();
        },
        get ListItemsUseCase(): ListItemsUseCase {
          return getListItemsUseCase();
        },
        get GetItemUseCase(): GetItemUseCase {
          return getGetItemUseCase();
        },
        get DeleteItemUseCase(): DeleteItemUseCase {
          return getDeleteItemUseCase();
        },
        get CreateItemUseCase(): CreateItemUseCase {
          return getCreateItemUseCase();
        },
        get ProductUpdateItemUseCase(): ProductUpdateItemUseCase {
          return getProductUpdateItemUseCase();
        },
        get IProductRepository(): ProductRepository {
          return getProductRepository();
        },
        get ProductRepository(): ProductRepository {
          return getProductRepository();
        },
        get ProductController(): ProductController {
          return getProductController();
        },
        get ProductListItemsUseCase(): ProductListItemsUseCase {
          return getProductListItemsUseCase();
        },
        get ProductGetItemUseCase(): ProductGetItemUseCase {
          return getProductGetItemUseCase();
        },
        get ProductDeleteItemUseCase(): ProductDeleteItemUseCase {
          return getProductDeleteItemUseCase();
        },
        get ProductCreateItemUseCase(): ProductCreateItemUseCase {
          return getProductCreateItemUseCase();
        },
        get OrderUpdateItemUseCase(): OrderUpdateItemUseCase {
          return getOrderUpdateItemUseCase();
        },
        get IOrderRepository(): OrderRepository {
          return getOrderRepository();
        },
        get OrderRepository(): OrderRepository {
          return getOrderRepository();
        },
        get OrderController(): OrderController {
          return getOrderController();
        },
        get OrderListItemsUseCase(): OrderListItemsUseCase {
          return getOrderListItemsUseCase();
        },
        get OrderGetItemUseCase(): OrderGetItemUseCase {
          return getOrderGetItemUseCase();
        },
        get OrderDeleteItemUseCase(): OrderDeleteItemUseCase {
          return getOrderDeleteItemUseCase();
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

// 🎯 Auto-generate all possible paths using TypeScript
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T]: K extends string
    ? T[K] extends object
      ? Prefix extends ""
        ? K | `${K}.${Paths<T[K]>}`
        : `${Prefix}.${K}` | `${Prefix}.${K}.${Paths<T[K]>}`
      : Prefix extends ""
        ? K
        : `${Prefix}.${K}`
    : never;
}[keyof T];

// ✨ All container keys automatically derived!
export type ContainerKey = Paths<Container>;

// 🎯 Auto-resolve return types using template literals
type GetByPath<T, P extends string> = 
  P extends keyof T
    ? T[P]
    : P extends `${infer K}.${infer Rest}`
      ? K extends keyof T
        ? GetByPath<T[K], Rest>
        : never
      : never;

const CONTAINER_INIT_KEY = Symbol.for('ioc-container-initialized');

export function onInit(): void {
  // TODO: Implement your post-construction logic here
}

export function inject<T extends ContainerKey>(key: T): GetByPath<Container, T> {
  if (!(globalThis as any)[CONTAINER_INIT_KEY]) {
    onInit();
    (globalThis as any)[CONTAINER_INIT_KEY] = true;
  }
  
  // Parse path and traverse object
  const parts = key.split('.');
  let current: any = container;
  
  for (const part of parts) {
    current = current[part];
  }
  
  return current;
}
