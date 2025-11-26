import { describe, it, expect, beforeEach } from 'vitest';
import { Container, Lifecycle } from '../src/Container';
import { ContainerModule } from '../src/ContainerModule';

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

        const myModule = new ContainerModule();
        myModule.register(ModuleService, {
            useClass: ModuleService,
            lifecycle: Lifecycle.Singleton,
        });

        container.registerModule(myModule);
        expect(container.resolve(ModuleService)).toBeInstanceOf(ModuleService);
    });

    describe('Factory Functions', () => {
        it('should register and resolve a service using factory function', () => {
            class TodoService {
                constructor(public name: string) { }
                getName() { return this.name; }
            }

            function createTodoService(): TodoService {
                return new TodoService('My Todo Service');
            }

            container.register('ITodoService', {
                useFactory: createTodoService,
                lifecycle: Lifecycle.Transient,
            });

            const service = container.resolve('ITodoService');
            expect(service).toBeInstanceOf(TodoService);
            expect(service.getName()).toBe('My Todo Service');
        });

        it('should resolve factory function with dependencies', () => {
            interface IUserRepo {
                getUser(id: string): string;
            }

            interface ITodoRepo {
                getTodo(id: string): string;
            }

            class UserRepo implements IUserRepo {
                getUser(id: string) { return `User ${id}`; }
            }

            class TodoRepo implements ITodoRepo {
                getTodo(id: string) { return `Todo ${id}`; }
            }

            class TodoUseCase {
                constructor(
                    public userRepo: IUserRepo,
                    public todoRepo: ITodoRepo
                ) { }
                execute() {
                    return `${this.userRepo.getUser('1')} - ${this.todoRepo.getTodo('1')}`;
                }
            }

            function createTodoUseCase(userRepo: IUserRepo, todoRepo: ITodoRepo): TodoUseCase {
                return new TodoUseCase(userRepo, todoRepo);
            }

            container.register('IUserRepo', {
                useClass: UserRepo,
                lifecycle: Lifecycle.Singleton,
            });

            container.register('ITodoRepo', {
                useClass: TodoRepo,
                lifecycle: Lifecycle.Singleton,
            });

            container.register('ITodoUseCase', {
                useFactory: createTodoUseCase,
                dependencies: ['IUserRepo', 'ITodoRepo'],
                lifecycle: Lifecycle.Transient,
            });

            const useCase = container.resolve('ITodoUseCase');
            expect(useCase).toBeInstanceOf(TodoUseCase);
            expect(useCase.execute()).toBe('User 1 - Todo 1');
        });

        it('should support singleton lifecycle with factory functions', () => {
            let callCount = 0;

            function createService(): { id: number } {
                callCount++;
                return { id: callCount };
            }

            container.register('IService', {
                useFactory: createService,
                lifecycle: Lifecycle.Singleton,
            });

            const instance1 = container.resolve('IService');
            const instance2 = container.resolve('IService');

            expect(instance1).toBe(instance2);
            expect(instance1.id).toBe(1);
            expect(instance2.id).toBe(1);
            expect(callCount).toBe(1);
        });

        it('should support transient lifecycle with factory functions', () => {
            let callCount = 0;

            function createService(): { id: number } {
                callCount++;
                return { id: callCount };
            }

            container.register('IService', {
                useFactory: createService,
                lifecycle: Lifecycle.Transient,
            });

            const instance1 = container.resolve('IService');
            const instance2 = container.resolve('IService');

            expect(instance1).not.toBe(instance2);
            expect(instance1.id).toBe(1);
            expect(instance2.id).toBe(2);
            expect(callCount).toBe(2);
        });

        it('should support factory functions in ContainerModule', () => {
            class ServiceA {
                value = 'A';
            }

            class ServiceB {
                constructor(public serviceA: ServiceA) { }
            }

            function createServiceB(serviceA: ServiceA): ServiceB {
                return new ServiceB(serviceA);
            }

            const module = new ContainerModule()
                .register(ServiceA, {
                    useClass: ServiceA,
                    lifecycle: Lifecycle.Singleton,
                })
                .register(ServiceB, {
                    useFactory: createServiceB,
                    dependencies: [ServiceA],
                    lifecycle: Lifecycle.Transient,
                });

            container.registerModule(module);

            const serviceB = container.resolve(ServiceB);
            expect(serviceB).toBeInstanceOf(ServiceB);
            expect(serviceB.serviceA.value).toBe('A');
        });

        it('should handle factory functions with complex business logic', () => {
            interface IConfig {
                apiUrl: string;
            }

            class Config implements IConfig {
                constructor(public apiUrl: string) { }
            }

            class ApiClient {
                constructor(public config: IConfig, public retries: number) { }
                getUrl() { return this.config.apiUrl; }
                getRetries() { return this.retries; }
            }

            function createConfig(): IConfig {
                return new Config('https://api.production.example.com');
            }

            function createApiClient(config: IConfig): ApiClient {
                // Complex business logic
                const retries = config.apiUrl.includes('production') ? 3 : 1;
                return new ApiClient(config, retries);
            }

            container.register('IConfig', {
                useFactory: createConfig,
                lifecycle: Lifecycle.Singleton,
            });

            container.register('IApiClient', {
                useFactory: createApiClient,
                dependencies: ['IConfig'],
                lifecycle: Lifecycle.Singleton,
            });

            const client = container.resolve('IApiClient');
            expect(client).toBeInstanceOf(ApiClient);
            expect(client.getUrl()).toBe('https://api.production.example.com');
            expect(client.getRetries()).toBe(3);
        });

        it('should support factory functions with context object pattern', () => {
            interface IRepo1 {
                getValue(): string;
            }

            interface IRepo2 {
                getValue(): string;
            }

            class Repo1 implements IRepo1 {
                getValue() { return 'Repo1'; }
            }

            class Repo2 implements IRepo2 {
                getValue() { return 'Repo2'; }
            }

            function createUseCase(context: { repo1: IRepo1, repo2: IRepo2 }) {
                return () => {
                    return `${context.repo1.getValue()}-${context.repo2.getValue()}`;
                };
            }

            container.register('IRepo1', {
                useClass: Repo1,
                lifecycle: Lifecycle.Singleton,
            });

            container.register('IRepo2', {
                useClass: Repo2,
                lifecycle: Lifecycle.Singleton,
            });

            container.register('IUseCase', {
                useFactory: createUseCase,
                dependencies: ['IRepo1', 'IRepo2'],
                contextObject: ['repo1', 'repo2'],
                lifecycle: Lifecycle.Singleton,
            });

            const useCase = container.resolve('IUseCase');
            expect(typeof useCase).toBe('function');
            expect(useCase()).toBe('Repo1-Repo2');
        });

        it('should support context object pattern with singleton lifecycle', () => {
            class ServiceA {
                id = Math.random();
            }

            function createService(context: { serviceA: ServiceA }) {
                return context.serviceA;
            }

            container.register(ServiceA, {
                useClass: ServiceA,
                lifecycle: Lifecycle.Singleton,
            });

            container.register('IService', {
                useFactory: createService,
                dependencies: [ServiceA],
                contextObject: ['serviceA'],
                lifecycle: Lifecycle.Singleton,
            });

            const instance1 = container.resolve('IService');
            const instance2 = container.resolve('IService');

            expect(instance1).toBe(instance2);
            expect(instance1.id).toBe(instance2.id);
        });

        it('should support context object pattern with transient lifecycle', () => {
            let callCount = 0;

            class ServiceA {
                id = callCount++;
            }

            function createService(context: { serviceA: ServiceA }) {
                return { id: context.serviceA.id };
            }

            container.register(ServiceA, {
                useClass: ServiceA,
                lifecycle: Lifecycle.Transient,
            });

            container.register('IService', {
                useFactory: createService,
                dependencies: [ServiceA],
                contextObject: ['serviceA'],
                lifecycle: Lifecycle.Transient,
            });

            const instance1 = container.resolve('IService');
            const instance2 = container.resolve('IService');

            expect(instance1).not.toBe(instance2);
        });

        it('should maintain backward compatibility with individual parameters', () => {
            class ServiceA {
                value = 'A';
            }

            function createService(serviceA: ServiceA) {
                return { value: serviceA.value };
            }

            container.register(ServiceA, {
                useClass: ServiceA,
                lifecycle: Lifecycle.Singleton,
            });

            container.register('IService', {
                useFactory: createService,
                dependencies: [ServiceA],
                lifecycle: Lifecycle.Singleton,
            });

            const service = container.resolve('IService');
            expect(service.value).toBe('A');
        });
    });
});

