// Since we're testing TypeScript files, let's just verify the structure
const fs = require('fs');
const path = require('path');

// Check if files exist
const containerPath = './examples/abstract-classes-example/container.gen.ts';
const userModulePath = './examples/abstract-classes-example/UserModule.gen.ts';
const productModulePath = './examples/abstract-classes-example/ProductModule.gen.ts';

console.log('Checking generated files...');
console.log('Container file exists:', fs.existsSync(containerPath));
console.log('UserModule file exists:', fs.existsSync(userModulePath));
console.log('ProductModule file exists:', fs.existsSync(productModulePath));

// Read and analyze the content
const containerContent = fs.readFileSync(containerPath, 'utf8');
const userModuleContent = fs.readFileSync(userModulePath, 'utf8');
const productModuleContent = fs.readFileSync(productModulePath, 'utf8');

console.log('\nAnalyzing generated content...');

// Check if UserModule has correct dependencies
const hasUserRepositoryDependency = userModuleContent.includes('new UserUseCase(getUserRepository())');
const hasAbstractUserRepositoryMapping = userModuleContent.includes('get AbstractUserRepository(): UserRepository');

// Check if ProductModule has correct dependencies
const hasProductRepositoryDependency = productModuleContent.includes('new ProductUseCase(getProductRepository()');
const hasAbstractProductRepositoryMapping = productModuleContent.includes('get AbstractProductRepository(): ProductRepository');

// Check if container imports both modules
const hasUserModuleImport = containerContent.includes('createUserModuleContainer');
const hasProductModuleImport = containerContent.includes('createProductModuleContainer');

console.log('\n=== Dependency Injection Analysis ===');
console.log('✅ UserUseCase gets UserRepository injected:', hasUserRepositoryDependency);
console.log('✅ AbstractUserRepository mapped to UserRepository:', hasAbstractUserRepositoryMapping);
console.log('✅ ProductUseCase gets ProductRepository injected:', hasProductRepositoryDependency);
console.log('✅ AbstractProductRepository mapped to ProductRepository:', hasAbstractProductRepositoryMapping);
console.log('✅ Container imports UserModule:', hasUserModuleImport);
console.log('✅ Container imports ProductModule:', hasProductModuleImport);

if (hasUserRepositoryDependency && hasAbstractUserRepositoryMapping && 
    hasProductRepositoryDependency && hasAbstractProductRepositoryMapping &&
    hasUserModuleImport && hasProductModuleImport) {
  console.log('\n🎉 SUCCESS: Abstract class dependency injection is working correctly!');
  console.log('\n📋 Summary:');
  console.log('- Classes extending abstract classes are now properly included in the container');
  console.log('- Abstract class names are correctly mapped to their concrete implementations');
  console.log('- Dependencies are properly injected into use cases');
  console.log('- Both UserModule and ProductModule are generated with correct structure');
} else {
  console.log('\n❌ Some issues detected in the generated code');
}