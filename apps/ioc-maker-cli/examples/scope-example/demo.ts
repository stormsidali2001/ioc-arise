import { container } from './container.gen';

console.log('🚀 IoC Arise Scope Example Demo\n');
console.log('=' .repeat(60));

// Demonstrate Singleton Behavior
console.log('\n📌 SINGLETON BEHAVIOR DEMONSTRATION');
console.log('-'.repeat(40));

// Get singleton service multiple times - should be same instance
const singleton1 = container.coreModule.ISingletonService;
const singleton2 = container.coreModule.ISingletonService;
const singleton3 = container.coreModule.ISingletonService;

console.log(`\n🔍 Singleton Instance IDs:`);
console.log(`   First call:  ${singleton1.getInstanceId()}`);
console.log(`   Second call: ${singleton2.getInstanceId()}`);
console.log(`   Third call:  ${singleton3.getInstanceId()}`);
console.log(`   Same instance? ${singleton1.getInstanceId() === singleton2.getInstanceId() && singleton2.getInstanceId() === singleton3.getInstanceId()}`);

// Demonstrate state persistence in singleton
console.log(`\n📊 Singleton State Persistence:`);
singleton1.incrementCounter(); // Counter: 1
singleton2.incrementCounter(); // Counter: 2 (same instance)
singleton3.incrementCounter(); // Counter: 3 (same instance)
console.log(`   Final counter value: ${singleton1.getCounter()}`);

// Demonstrate Transient Behavior
console.log('\n⚡ TRANSIENT BEHAVIOR DEMONSTRATION');
console.log('-'.repeat(40));

// Get transient service multiple times - should be different instances
const transient1 = container.coreModule.ITransientService;
const transient2 = container.coreModule.ITransientService;
const transient3 = container.coreModule.ITransientService;

console.log(`\n🔍 Transient Instance IDs:`);
console.log(`   First call:  ${transient1.getInstanceId()}`);
console.log(`   Second call: ${transient2.getInstanceId()}`);
console.log(`   Third call:  ${transient3.getInstanceId()}`);
console.log(`   Different instances? ${transient1.getInstanceId() !== transient2.getInstanceId() && transient2.getInstanceId() !== transient3.getInstanceId()}`);

// Demonstrate transient processing
console.log(`\n🔄 Transient Processing:`);
transient1.processData('hello world');
transient2.processData('dependency injection');
transient3.processData('ioc arise');

// Demonstrate Mixed Service Behavior
console.log('\n🔀 MIXED SERVICE BEHAVIOR DEMONSTRATION');
console.log('-'.repeat(40));

// Get mixed service multiple times - should be same instance (singleton)
const mixed1 = container.coreModule.MixedService;
const mixed2 = container.coreModule.MixedService;

console.log(`\n🔍 Mixed Service Instance IDs:`);
console.log(`   First call:  ${mixed1.getInstanceId()}`);
console.log(`   Second call: ${mixed2.getInstanceId()}`);
console.log(`   Same instance? ${mixed1.getInstanceId() === mixed2.getInstanceId()}`);

// Demonstrate mixed service operations
console.log(`\n🎯 Mixed Service Operations:`);
mixed1.performComplexOperation('first operation');
mixed1.performComplexOperation('second operation');
mixed2.performComplexOperation('third operation'); // Same mixed service, but new transient dependency

// Show final singleton state
console.log(`\n📋 Final State Information:`);
const finalSingleton = container.coreModule.ISingletonService;
console.log(`   Final singleton counter: ${finalSingleton.getCounter()}`);
console.log(`   Singleton logs count: ${finalSingleton.getLogs().length}`);

console.log(`\n🔍 Key Observations:`);
console.log(`   - Singleton services maintain state across calls`);
console.log(`   - Transient services are created fresh each time`);
console.log(`   - Mixed services demonstrate both patterns working together`);
console.log(`   - JSDoc @scope annotations control service lifecycles`);

console.log('\n' + '='.repeat(60));
console.log('✅ Demo completed! Check the logs above to see how scoping works.');