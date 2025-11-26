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
      if ('useFactory' in registration && registration.useFactory) {
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
    this.providers.set(this.getTokenId(token), {
      token,
      useClass: 'useClass' in provider ? provider.useClass : undefined,
      useFactory: 'useFactory' in provider ? provider.useFactory : undefined,
      lifecycle: provider.lifecycle || Lifecycle.Transient,
      dependencies: provider.dependencies || [],
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
          `Provider for token ${String(token)} must have either useClass or useFactory`,
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
