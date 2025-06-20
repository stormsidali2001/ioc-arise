import { ProductUseCase } from './use-cases/ProductUseCase';
import { ProductRepository } from './implementations/ProductRepository';
import { createUserModuleContainer } from './UserModule.gen';
function createProductModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {

  let productRepository: ProductRepository | undefined;
  let productUseCase: ProductUseCase | undefined;

  const getProductRepository = (): ProductRepository => {
    if (!productRepository) {
      productRepository = new ProductRepository();
    }
    return productRepository;
  };
  const getProductUseCase = (): ProductUseCase => {
    if (!productUseCase) {
      productUseCase = new ProductUseCase(getProductRepository(), userModuleContainer.UserRepository);
    }
    return productUseCase;
  };

  return {
        get ProductUseCase(): ProductUseCase {
          return getProductUseCase();
        },
        get ProductRepository(): ProductRepository {
          return getProductRepository();
        },
        get AbstractRepository(): ProductRepository {
          return getProductRepository();
        }
  };
}
export { createProductModuleContainer };
export type ProductModuleContainer = ReturnType<typeof createProductModuleContainer>;