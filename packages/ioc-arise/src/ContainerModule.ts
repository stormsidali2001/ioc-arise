import { Token, Lifecycle } from './Container';

interface ProviderRegistration<T = any> {
    token: Token<T>;
    useClass?: new (...args: any[]) => T;
    useFactory?: (...args: any[]) => T;
    dependencies?: Token<any>[];
    lifecycle?: Lifecycle;
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

export class ContainerModule {
    private registrations: ProviderRegistration[] = [];

    public register<T>(token: Token<T>, provider: ProviderConfig<T>): this {
        this.registrations.push({
            token,
            useClass: 'useClass' in provider ? provider.useClass : undefined,
            useFactory: 'useFactory' in provider ? provider.useFactory : undefined,
            dependencies: provider.dependencies,
            lifecycle: provider.lifecycle,
        });
        return this;
    }

    public getRegistrations(): ProviderRegistration[] {
        return this.registrations;
    }
}

