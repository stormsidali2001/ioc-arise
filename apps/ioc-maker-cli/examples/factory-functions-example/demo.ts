import { container } from './container.gen';

function demo() {
    console.log('🚀 Factory Function Demo\n');

    // Resolve the factory function
    const createTodo = container.resolve('createTodoUseCase');

    // Use the factory function directly
    createTodo('user-1', 'Buy groceries');
    createTodo('user-2', 'Walk the dog');

    console.log('\n✅ Demo completed!');
}

demo();

