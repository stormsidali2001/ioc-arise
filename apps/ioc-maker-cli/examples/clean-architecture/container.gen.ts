import { createUserModuleContainer } from './UserModule.gen';
import { createTodoModuleContainer } from './TodoModule.gen';

const userModuleContainer = createUserModuleContainer();
const todoModuleContainer = createTodoModuleContainer(userModuleContainer);

export const container = {
  userModule: userModuleContainer,
  todoModule: todoModuleContainer
};

export type Container = typeof container;

import { EventEmitter } from 'events';

// 🎯 Auto-generate all possible paths using TypeScript
type Paths<T, Prefix extends string = ""> = {
  [K in keyof T]: K extends string
    ? T[K] extends object
      ? Prefix extends ""
        ? K | `${K}.${Paths<T[K]>}`
        : `${Prefix}.${K}` | `${Prefix}.${K}.${Paths<T[K]>}`
      : Prefix extends ""
        ? K
        : `${Prefix}.${K}`
    : never;
}[keyof T];

// ✨ All container keys automatically derived!
export type ContainerKey = Paths<Container>;

// 🎯 Auto-resolve return types using template literals
type GetByPath<T, P extends string> = 
  P extends keyof T
    ? T[P]
    : P extends `${infer K}.${infer Rest}`
      ? K extends keyof T
        ? GetByPath<T[K], Rest>
        : never
      : never;

const CONTAINER_INIT_KEY = Symbol.for('ioc-container-initialized');

export function onInit(): void {
  // Custom initer ialization logic added by user
    console.log('🚀 IoC Container initialized!');

    const eventBus = container.userModule.UserRepository;
    const emitter = new EventEmitter();

    console.log('Setting up event listeners...', { eventBus });
    emitter.emit('container-ready');

    // Initialize global state
    console.log('✅ Container initialization complete!');
}

export function inject<T extends ContainerKey>(key: T): GetByPath<Container, T> {
  if (!(globalThis as any)[CONTAINER_INIT_KEY]) {
    onInit();
    (globalThis as any)[CONTAINER_INIT_KEY] = true;
  }
  
  // Parse path and traverse object
  const parts = key.split('.');
  let current: any = container;
  
  for (const part of parts) {
    current = current[part];
  }
  
  return current;
}