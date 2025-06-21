import { container } from './container.gen';

// Test the generated container
console.log('Testing abstract class dependency injection...');

// Test UserModule
const userUseCase = container.userModule.UserUseCase;
console.log('UserUseCase created:', !!userUseCase);

// Test ProductModule
const productUseCase = container.productModule.ProductUseCase;
console.log('ProductUseCase created:', !!productUseCase);

// Test that abstract classes are mapped to concrete implementations
const abstractUserRepo = container.userModule.AbstractUserRepository;
const concreteUserRepo = container.userModule.UserRepository;
console.log('AbstractUserRepository maps to UserRepository:', abstractUserRepo === concreteUserRepo);

const abstractProductRepo = container.productModule.AbstractProductRepository;
const concreteProductRepo = container.productModule.ProductRepository;
console.log('AbstractProductRepository maps to ProductRepository:', abstractProductRepo === concreteProductRepo);

console.log('All tests completed!');