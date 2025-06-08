import { container } from './container.gen';
import { CreateUserRequestDTO, GetUserRequestDTO, DeleteUserRequestDTO } from './dtos/UserDTOs';

/**
 * Demo script showcasing Clean Architecture with Dependency Injection
 * 
 * This script demonstrates:
 * - Use cases orchestration through the generated container
 * - Presenter humble objects with ViewModels containing UI flags
 * - Separation of concerns between entities, use cases, and presenters
 * - View-related business logic in presenters
 */

async function runCleanArchitectureDemo() {
  console.log('🏗️  Clean Architecture Demo with Dependency Injection\n');
  console.log('=' .repeat(60));
  
  // Extract use cases and presenters from the container
  const {
    createUserUseCase,
    getUserUseCase,
    deleteUserUseCase,
    createUserPresenter,
    getUserPresenter,
    deleteUserPresenter
  } = container;

  console.log('\n📋 Available components in container:');
  console.log('   - CreateUserUseCase');
  console.log('   - GetUserUseCase');
  console.log('   - DeleteUserUseCase');
  console.log('   - UserRepository (in-memory)');
  console.log('   - Presenters with ViewModels');
  
  // Demo 1: Create User
  console.log('\n\n🔹 Demo 1: Creating a new user');
  console.log('-'.repeat(40));
  
  // Set loading state in presenter
  createUserPresenter.setLoading(true);
  console.log('📊 ViewModel state (loading):', JSON.stringify(createUserPresenter.getViewModel(), null, 2));
  
  const createRequest: CreateUserRequestDTO = {
    name: 'John Doe',
    email: 'john.doe@example.com'
  };
  
  console.log('📤 Creating user:', createRequest);
  await createUserUseCase.execute(createRequest);
  
  console.log('📊 ViewModel state (after creation):', JSON.stringify(createUserPresenter.getViewModel(), null, 2));
  
  // Demo 2: Get User (Success)
  console.log('\n\n🔹 Demo 2: Retrieving existing user');
  console.log('-'.repeat(40));
  
  getUserPresenter.setLoading(true);
  console.log('📊 ViewModel state (loading):', JSON.stringify(getUserPresenter.getViewModel(), null, 2));
  
  const getRequest: GetUserRequestDTO = {
    id: '1' // Assuming the first user gets ID '1'
  };
  
  console.log('📤 Getting user with ID:', getRequest.id);
  await getUserUseCase.execute(getRequest);
  
  console.log('📊 ViewModel state (after retrieval):', JSON.stringify(getUserPresenter.getViewModel(), null, 2));
  
  // Demo 3: Get User (Not Found)
  console.log('\n\n🔹 Demo 3: Retrieving non-existent user');
  console.log('-'.repeat(40));
  
  getUserPresenter.setLoading(true);
  
  const getNotFoundRequest: GetUserRequestDTO = {
    id: '999' // Non-existent user
  };
  
  console.log('📤 Getting user with ID:', getNotFoundRequest.id);
  await getUserUseCase.execute(getNotFoundRequest);
  
  console.log('📊 ViewModel state (not found):', JSON.stringify(getUserPresenter.getViewModel(), null, 2));
  
  // Demo 4: Create Another User
  console.log('\n\n🔹 Demo 4: Creating another user');
  console.log('-'.repeat(40));
  
  createUserPresenter.setLoading(true);
  
  const createRequest2: CreateUserRequestDTO = {
    name: 'Jane Smith',
    email: 'jane.smith@example.com'
  };
  
  console.log('📤 Creating user:', createRequest2);
  await createUserUseCase.execute(createRequest2);
  
  console.log('📊 ViewModel state (second user created):', JSON.stringify(createUserPresenter.getViewModel(), null, 2));
  
  // Demo 5: Delete User (Success)
  console.log('\n\n🔹 Demo 5: Deleting existing user');
  console.log('-'.repeat(40));
  
  deleteUserPresenter.setLoading(true);
  console.log('📊 ViewModel state (loading):', JSON.stringify(deleteUserPresenter.getViewModel(), null, 2));
  
  const deleteRequest: DeleteUserRequestDTO = {
    id: '1'
  };
  
  console.log('📤 Deleting user with ID:', deleteRequest.id);
  await deleteUserUseCase.execute(deleteRequest);
  
  console.log('📊 ViewModel state (after deletion):', JSON.stringify(deleteUserPresenter.getViewModel(), null, 2));
  
  // Demo 6: Delete User (Not Found)
  console.log('\n\n🔹 Demo 6: Deleting non-existent user');
  console.log('-'.repeat(40));
  
  deleteUserPresenter.setLoading(true);
  
  const deleteNotFoundRequest: DeleteUserRequestDTO = {
    id: '999'
  };
  
  console.log('📤 Deleting user with ID:', deleteNotFoundRequest.id);
  await deleteUserUseCase.execute(deleteNotFoundRequest);
  
  console.log('📊 ViewModel state (not found for deletion):', JSON.stringify(deleteUserPresenter.getViewModel(), null, 2));
  
  // Demo 7: Verify User Was Deleted
  console.log('\n\n🔹 Demo 7: Verifying user deletion');
  console.log('-'.repeat(40));
  
  getUserPresenter.setLoading(true);
  
  const verifyDeleteRequest: GetUserRequestDTO = {
    id: '1' // This user should now be deleted
  };
  
  console.log('📤 Trying to get deleted user with ID:', verifyDeleteRequest.id);
  await getUserUseCase.execute(verifyDeleteRequest);
  
  console.log('📊 ViewModel state (deleted user not found):', JSON.stringify(getUserPresenter.getViewModel(), null, 2));
  
  // Summary
  console.log('\n\n📋 Clean Architecture Demo Summary');
  console.log('=' .repeat(60));
  console.log('✅ Demonstrated dependency injection through generated container');
  console.log('✅ Showcased use case orchestration');
  console.log('✅ Illustrated presenter humble objects with ViewModels');
  console.log('✅ Showed view-related business logic (loading states, UI flags)');
  console.log('✅ Demonstrated separation of concerns:');
  console.log('   • Entities: Pure business objects');
  console.log('   • Use Cases: Application business rules');
  console.log('   • Presenters: View-related business logic');
  console.log('   • ViewModels: UI state and flags');
  console.log('   • Repository: Data access abstraction');
  console.log('\n🎉 Clean Architecture implementation complete!');
}

// Error handling wrapper
async function main() {
  try {
    await runCleanArchitectureDemo();
  } catch (error) {
    console.error('❌ Demo failed:', error);
    process.exit(1);
  }
}

// Run the demo
if (require.main === module) {
  main();
}

export { runCleanArchitectureDemo };