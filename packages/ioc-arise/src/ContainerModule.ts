import { Token, Lifecycle } from './Container';

interface ProviderRegistration<T = any> {
    token: Token<T>;
    useClass?: new (...args: any[]) => T;
    useFactory?: (...args: any[]) => T;
    useValue?: T;
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
    }
    | {
        useValue: T;
        lifecycle?: Lifecycle;
    };

export class ContainerModule {
    private registrations: ProviderRegistration[] = [];

    public register<T>(token: Token<T>, provider: ProviderConfig<T>): this {
        const dependencies = ('dependencies' in provider && provider.dependencies)
            ? provider.dependencies
            : undefined;

        this.registrations.push({
            token,
            useClass: 'useClass' in provider ? provider.useClass : undefined,
            useFactory: 'useFactory' in provider ? provider.useFactory : undefined,
            useValue: 'useValue' in provider ? provider.useValue : undefined,
            dependencies,
            lifecycle: provider.lifecycle,
        });
        return this;
    }

    public getRegistrations(): ProviderRegistration[] {
        return this.registrations;
    }
}

