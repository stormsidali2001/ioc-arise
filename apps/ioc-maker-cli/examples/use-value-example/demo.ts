import { container } from './container.gen';

function demo() {
  console.log('🚀 useValue Demo\n');

  // Resolve plain object services
  const userService = container.resolve('IUserService');
  const configService = container.resolve('IConfigService');

  console.log('📦 Using IUserService (plain object):');
  const user1 = userService.getUser('123');
  console.log(`  getUser('123'): ${user1}`);

  const newUser = userService.createUser({ name: 'John Doe', email: 'john@example.com' });
  console.log(`  createUser(...):`, newUser);

  console.log('\n📦 Using IConfigService (plain object):');
  console.log(`  API URL: ${configService.getApiUrl()}`);
  console.log(`  Timeout: ${configService.getTimeout()}ms`);
  console.log(`  Environment: ${configService.getEnvironment()}`);

  console.log('\n✅ Demo completed!');
}

demo();

