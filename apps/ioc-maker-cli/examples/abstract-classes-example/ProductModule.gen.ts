import { ProductRepository } from './implementations/ProductRepository';
import { ProductUseCase } from './use-cases/ProductUseCase';
import { InternalProductNestedUseCase } from './use-cases/InternalProductNestedUseCase';
import { createUserModuleContainer } from './UserModule.gen';
function createProductModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {

  let internalProductNestedUseCase: InternalProductNestedUseCase | undefined;
  let productUseCase: ProductUseCase | undefined;
  let productRepository: ProductRepository | undefined;

  const getInternalProductNestedUseCase = (): InternalProductNestedUseCase => {
    if (!internalProductNestedUseCase) {
      internalProductNestedUseCase = new InternalProductNestedUseCase(getProductRepository());
    }
    return internalProductNestedUseCase;
  };
  const getProductUseCase = (): ProductUseCase => {
    if (!productUseCase) {
      productUseCase = new ProductUseCase(getProductRepository(), userModuleContainer.UserRepository, getInternalProductNestedUseCase());
    }
    return productUseCase;
  };
  const getProductRepository = (): ProductRepository => {
    if (!productRepository) {
      productRepository = new ProductRepository();
    }
    return productRepository;
  };

  return {
        get AbstractProductRepository(): ProductRepository {
          return getProductRepository();
        },
        get ProductRepository(): ProductRepository {
          return getProductRepository();
        },
        get ProductUseCase(): ProductUseCase {
          return getProductUseCase();
        },
        get InternalProductNestedUseCase(): InternalProductNestedUseCase {
          return getInternalProductNestedUseCase();
        }
  };
}
export { createProductModuleContainer };
export type ProductModuleContainer = ReturnType<typeof createProductModuleContainer>;