import { container } from './container.gen';

function demo() {
    console.log('🚀 Factory Function Demo\n');

    // Resolve factory functions
    const createTodo = container.resolve('createTodoUseCase'); // Context object pattern
    const getUser = container.resolve('createUserUseCase'); // Separate parameters pattern

    console.log('📦 Using context object pattern factory:');
    createTodo('user-1', 'Buy groceries');
    createTodo('user-2', 'Walk the dog');

    console.log('\n📦 Using separate parameters factory:');
    const user1 = getUser('user-1');
    const user2 = getUser('user-2');
    console.log(`User 1: ${user1}`);
    console.log(`User 2: ${user2}`);

    console.log('\n✅ Demo completed!');
}

demo();

