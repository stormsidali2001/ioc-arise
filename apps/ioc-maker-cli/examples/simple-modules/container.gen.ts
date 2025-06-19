import { createUserModuleContainer } from './UserModule.gen';
import { createTodoModuleContainer } from './TodoModule.gen';

const userModuleContainer = createUserModuleContainer();
const todoModuleContainer = createTodoModuleContainer(userModuleContainer);

export const container = {
  userModule: userModuleContainer,
  todoModule: todoModuleContainer
};

export type Container = typeof container;