import { describe, it, expect, beforeEach } from 'vitest';
import { Container, Lifecycle } from '../src/Container';
import { Module } from '../src/Module';

class ServiceA {
    sayHello() { return 'Hello from A'; }
}

class ServiceB {
    constructor(private serviceA: ServiceA) { }
    greet() { return `Service B says: ${this.serviceA.sayHello()}`; }
}

describe('Container', () => {
    let container: Container;

    beforeEach(() => {
        container = new Container();
    });

    it('should register and resolve a transient service', () => {
        container.register(ServiceA, {
            useClass: ServiceA,
            lifecycle: Lifecycle.Transient,
        });

        const instance1 = container.resolve(ServiceA);
        const instance2 = container.resolve(ServiceA);

        expect(instance1).toBeInstanceOf(ServiceA);
        expect(instance1).not.toBe(instance2);
    });

    it('should register and resolve a singleton service', () => {
        container.register(ServiceA, {
            useClass: ServiceA,
            lifecycle: Lifecycle.Singleton,
        });

        const instance1 = container.resolve(ServiceA);
        const instance2 = container.resolve(ServiceA);

        expect(instance1).toBeInstanceOf(ServiceA);
        expect(instance1).toBe(instance2);
    });

    it('should resolve dependencies', () => {
        container.register(ServiceA, {
            useClass: ServiceA,
            lifecycle: Lifecycle.Singleton,
        });

        container.register(ServiceB, {
            useClass: ServiceB,
            dependencies: [ServiceA],
            lifecycle: Lifecycle.Transient,
        });

        const serviceB = container.resolve(ServiceB);
        expect(serviceB).toBeInstanceOf(ServiceB);
        expect(serviceB.greet()).toBe('Service B says: Hello from A');
    });

    it('should detect circular dependencies', () => {
        class CycleA { constructor(public b: any) { } }
        class CycleB { constructor(public a: any) { } }

        container.register(CycleA, {
            useClass: CycleA,
            dependencies: [CycleB],
            lifecycle: Lifecycle.Transient,
        });

        container.register(CycleB, {
            useClass: CycleB,
            dependencies: [CycleA],
            lifecycle: Lifecycle.Transient,
        });

        expect(() => container.resolve(CycleA)).toThrow(/Circular dependency detected/);
    });

    it('should load modules', () => {
        class ModuleService { value = 'module'; }

        const myModule: Module = {
            register(c: Container) {
                c.register(ModuleService, { useClass: ModuleService, lifecycle: Lifecycle.Singleton });
            }
        };

        container.load(myModule);
        expect(container.resolve(ModuleService)).toBeInstanceOf(ModuleService);
    });
});

