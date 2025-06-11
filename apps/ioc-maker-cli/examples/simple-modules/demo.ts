import { container } from './container.gen';

async function runDemo() {
  console.log('🚀 IoC Arise Simple Modules Demo\n');

  // Get services from different modules
  const userService = container.userModule.IUserService;
  const todoService = container.todoModule.ITodoService;

  console.log('📋 Getting all users:');
  const users = await userService.getAllUsers();
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`);
  });

  console.log('\n📝 Getting todos for user 1:');
  const userTodos = await todoService.getTodosByUser('1');
  userTodos.forEach(todo => {
    console.log(`  - ${todo.title} ${todo.completed ? '✅' : '⏳'}`);
  });

  console.log('\n➕ Creating a new todo:');
  const newTodo = await todoService.createTodo('Test IoC Arise modules', '1');
  console.log(`  Created: ${newTodo.title}`);

  console.log('\n✅ Marking todo as completed:');
  const updatedTodo = await todoService.updateTodo(newTodo.id, undefined, true);
  console.log(`  Updated: ${updatedTodo?.title} ${updatedTodo?.completed ? '✅' : '⏳'}`);

  console.log('\n🎉 Demo completed! Notice how:');
  console.log('  • UserModule and TodoModule are separate');
  console.log('  • TodoService depends on both modules');
  console.log('  • IoC Arise handles cross-module dependencies automatically');
  console.log('  • All dependencies are properly injected');
}

runDemo().catch(console.error);