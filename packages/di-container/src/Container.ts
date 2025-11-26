import { ContainerModule } from "./ContainerModule";

export type Token<T> = string | symbol | (new (...args: any[]) => T);

export enum Lifecycle {
  Transient = "TRANSIENT",
  Singleton = "SINGLETON",
}

interface Provider<T> {
  token: Token<T>;
  useClass?: new (...args: any[]) => T;
  useFactory?: (...args: any[]) => T;
  useValue?: T;
  dependencies?: Token<any>[];
  lifecycle: Lifecycle;
  instance?: T; // For singletons
}

type ProviderConfig<T> =
  | {
    useClass: new (...args: any[]) => T;
    dependencies?: Token<any>[];
    lifecycle?: Lifecycle;
  }
  | {
    useFactory: (...args: any[]) => T;
    dependencies?: Token<any>[];
    lifecycle?: Lifecycle;
    contextObject?: string[]; // Property names for context object (in dependency order)
  }
  | {
    useValue: T;
    lifecycle?: Lifecycle; // Optional, defaults to Singleton
  };

export interface IContainer<TRegistry = Record<string, any>> {
  resolve<K extends keyof TRegistry>(token: K): TRegistry[K];
  register<T>(token: Token<T>, provider: ProviderConfig<T>): void;
  registerModule(module: ContainerModule): void;
  createChild(): IContainer<TRegistry>;
}

export class Container<TRegistry = Record<string, any>>
  implements IContainer<TRegistry> {
  private providers = new Map<Token<any>, Provider<any>>();
  private parent?: Container<TRegistry>;
  private resolutionStack = new Set<Token<any>>();

  constructor(parent?: Container<TRegistry>) {
    this.parent = parent;
  }

  public registerModule(module: ContainerModule): void {
    const registrations = module.getRegistrations();
    for (const registration of registrations) {
      if ('useValue' in registration && registration.useValue !== undefined) {
        this.register(registration.token, {
          useValue: registration.useValue,
          lifecycle: registration.lifecycle,
        });
      } else if ('useFactory' in registration && registration.useFactory) {
        this.register(registration.token, {
          useFactory: registration.useFactory,
          dependencies: registration.dependencies,
          lifecycle: registration.lifecycle,
        });
      } else if ('useClass' in registration && registration.useClass) {
        this.register(registration.token, {
          useClass: registration.useClass,
          dependencies: registration.dependencies,
          lifecycle: registration.lifecycle,
        });
      }
    }
  }

  private getTokenId(token: Token<any>): string | symbol {
    return typeof token === "function" ? token.name : token;
  }
  public register<T>(token: Token<T>, provider: ProviderConfig<T>): void {
    let useFactory = 'useFactory' in provider ? provider.useFactory : undefined;

    // If contextObject is specified, wrap the factory to pass dependencies as an object
    if (useFactory && 'contextObject' in provider && provider.contextObject) {
      const originalFactory = useFactory;
      const contextPropertyNames = provider.contextObject;

      // Create a wrapper that passes dependencies as a context object
      useFactory = ((...args: any[]) => {
        const context: Record<string, any> = {};
        // Map dependencies to context object properties by index
        args.forEach((arg, index) => {
          const propName = contextPropertyNames[index];
          if (propName) {
            context[propName] = arg;
          }
        });
        return originalFactory(context);
      }) as (...args: any[]) => T;
    }

    // Handle useValue - validate no dependencies and set default lifecycle
    const useValue = 'useValue' in provider ? provider.useValue : undefined;
    if (useValue !== undefined) {
      // useValue providers are pre-created, so they can't have dependencies
      // Default to Singleton since the value already exists
      const lifecycle = provider.lifecycle || Lifecycle.Singleton;

      this.providers.set(this.getTokenId(token), {
        token,
        useValue,
        lifecycle,
        dependencies: [], // useValue providers cannot have dependencies
      });
      return;
    }

    // For useClass and useFactory, get dependencies from provider
    const dependencies = ('dependencies' in provider && provider.dependencies)
      ? provider.dependencies
      : [];

    this.providers.set(this.getTokenId(token), {
      token,
      useClass: 'useClass' in provider ? provider.useClass : undefined,
      useFactory,
      lifecycle: provider.lifecycle || Lifecycle.Transient,
      dependencies,
    });
  }

  public resolve<K extends keyof TRegistry>(token: K): TRegistry[K];
  public resolve<T>(token: Token<T>): T;
  public resolve(token: any): any {
    const provider = this.providers.get(this.getTokenId(token));

    if (provider == null) {
      throw new Error(`No provider found for token: ${String(token)}`);
    }

    // Circular dependency check

    if (this.resolutionStack.has(token)) {
      const cycle = [...this.resolutionStack, token]
        .map((t) => String(t))
        .join(" -> ");
      throw new Error(`Circular dependency detected: ${cycle}`);
    }

    // Check for useValue first - return directly without dependency resolution
    if (provider.useValue !== undefined) {
      // useValue is always effectively a singleton (pre-created instance)
      // Store it as instance for consistency with singleton pattern
      if (provider.lifecycle === Lifecycle.Singleton && provider.instance === undefined) {
        provider.instance = provider.useValue;
      }
      return provider.instance || provider.useValue;
    }

    if (provider.lifecycle === Lifecycle.Singleton && provider.instance) {
      return provider.instance;
    }

    this.resolutionStack.add(token);

    try {
      const args = this.resolveDependencies(provider.dependencies || []);
      let instance: any;

      if (provider.useFactory) {
        instance = provider.useFactory(...args);
      } else if (provider.useClass) {
        instance = new provider.useClass(...args);
      } else {
        throw new Error(
          `Provider for token ${String(token)} must have either useClass, useFactory, or useValue`,
        );
      }

      if (provider.lifecycle === Lifecycle.Singleton) {
        provider.instance = instance;
      }

      return instance;
    } finally {
      this.resolutionStack.delete(token);
    }
  }

  private resolveDependencies(dependencies: Token<any>[]): any[] {
    return dependencies.map((dep) => this.resolve(dep));
  }

  public createChild(): IContainer<TRegistry> {
    return new Container<TRegistry>(this);
  }
}
