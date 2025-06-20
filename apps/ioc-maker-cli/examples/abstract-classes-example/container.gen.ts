import { createUserModuleContainer } from './UserModule.gen';
import { createProductModuleContainer } from './ProductModule.gen';

const userModuleContainer = createUserModuleContainer();
const productModuleContainer = createProductModuleContainer(userModuleContainer);

export const container = {
  userModule: userModuleContainer,
  productModule: productModuleContainer
};

export type Container = typeof container;