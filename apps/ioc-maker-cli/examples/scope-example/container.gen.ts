import { TransientService } from './services/TransientService';
import { SingletonService } from './services/SingletonService';
import { MixedService } from './services/MixedService';

function createCoreModuleContainer() {
  const transientServiceFactory = (): TransientService => new TransientService();

  let mixedService: MixedService | undefined;
  let singletonService: SingletonService | undefined;

  const getMixedService = (): MixedService => {
    if (!mixedService) {
      mixedService = new MixedService(getSingletonService(), transientServiceFactory());
    }
    return mixedService;
  };
  const getSingletonService = (): SingletonService => {
    if (!singletonService) {
      singletonService = new SingletonService();
    }
    return singletonService;
  };

  return {
        get TransientService(): TransientService {
          return transientServiceFactory();
        },
        get ITransientService(): TransientService {
          return transientServiceFactory();
        },
        get SingletonService(): SingletonService {
          return getSingletonService();
        },
        get ISingletonService(): SingletonService {
          return getSingletonService();
        },
        get MixedService(): MixedService {
          return getMixedService();
        }
  };
}

const coreModuleContainer = createCoreModuleContainer();

export const container = {
  coreModule: coreModuleContainer
};

export type Container = typeof container;
