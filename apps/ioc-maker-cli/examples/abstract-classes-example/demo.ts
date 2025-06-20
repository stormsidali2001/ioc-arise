import { container } from './container.gen';

// Demo function to showcase the two-module architecture
async function demo() {
  console.log('=== Two-Module Architecture Demo ===\n');

  // Access user module services
  const userUseCase = container.userModule.UserUseCase;
  const productUseCase = container.productModule.ProductUseCase;

  try {
    // 1. Create a user using the user module
    console.log('1. Creating a user...');
    const user = await userUseCase.createUser({
      name: 'John Doe',
      email: 'john.doe@example.com'
    });
    console.log('Created user:', user);
    console.log();

    // 2. Create a product using the product module (which depends on user module)
    console.log('2. Creating a product...');
    const product = await productUseCase.createProduct({
      name: 'Awesome Product',
      description: 'A really awesome product',
      price: 99.99,
      userId: user.id // Reference to the user we just created
    });
    console.log('Created product:', product);
    console.log();

    // 3. Get product with user details (demonstrates cross-module dependency)
    console.log('3. Getting product with user details...');
    const productWithUser = await productUseCase.getProductWithUser(product.id);
    console.log('Product with user:', productWithUser);
    console.log();

    // 4. Try to create a product with non-existent user (should fail)
    console.log('4. Trying to create product with non-existent user...');
    try {
      await productUseCase.createProduct({
        name: 'Invalid Product',
        description: 'This should fail',
        price: 50.00,
        userId: 'non-existent-user-id'
      });
    } catch (error) {
      console.log('Expected error:', error.message);
    }
    console.log();

    // 5. Get products by user ID
    console.log('5. Getting products by user ID...');
    const userProducts = await productUseCase.getProductsByUserId(user.id);
    console.log('User products:', userProducts);
    console.log();

    console.log('=== Demo completed successfully! ===');
    console.log('\nArchitecture highlights:');
    console.log('- Two separate modules: userModule and productModule');
    console.log('- Each module has its own repository extending AbstractRepository');
    console.log('- Each module has its own use case');
    console.log('- ProductUseCase depends on UserRepository (cross-module dependency)');
    console.log('- Proper dependency injection through container');

  } catch (error) {
    console.error('Demo failed:', error);
  }
}

// Run the demo
if (require.main === module) {
  demo();
}

export { demo };