import { ProductUseCase } from './use-cases/ProductUseCase';
import { InternalProductNestedUseCase } from './use-cases/InternalProductNestedUseCase';
import { ProductRepository } from './implementations/ProductRepository';
import { createUserModuleContainer } from './UserModule.gen';
function createProductModuleContainer(userModuleContainer: ReturnType<typeof createUserModuleContainer>) {

  let productRepository: ProductRepository | undefined;
  let internalProductNestedUseCase: InternalProductNestedUseCase | undefined;
  let productUseCase: ProductUseCase | undefined;

  const getProductRepository = (): ProductRepository => {
    if (!productRepository) {
      productRepository = new ProductRepository();
    }
    return productRepository;
  };
  const getInternalProductNestedUseCase = (): InternalProductNestedUseCase => {
    if (!internalProductNestedUseCase) {
      internalProductNestedUseCase = new InternalProductNestedUseCase(getProductRepository());
    }
    return internalProductNestedUseCase;
  };
  const getProductUseCase = (): ProductUseCase => {
    if (!productUseCase) {
      productUseCase = new ProductUseCase(getProductRepository(), userModuleContainer.AbstractUserRepository, getInternalProductNestedUseCase());
    }
    return productUseCase;
  };

  return {
        get ProductUseCase(): ProductUseCase {
          return getProductUseCase();
        },
        get InternalProductNestedUseCase(): InternalProductNestedUseCase {
          return getInternalProductNestedUseCase();
        },
        get AbstractProductRepository(): ProductRepository {
          return getProductRepository();
        }
  };
}
export { createProductModuleContainer };
export type ProductModuleContainer = ReturnType<typeof createProductModuleContainer>;