import { Token, Lifecycle } from './Container';

interface ProviderRegistration<T = any> {
    token: Token<T>;
    useClass: new (...args: any[]) => T;
    dependencies?: Token<any>[];
    lifecycle?: Lifecycle;
}

export class ContainerModule {
    private registrations: ProviderRegistration[] = [];

    public register<T>(
        token: Token<T>,
        provider: {
            useClass: new (...args: any[]) => T;
            dependencies?: Token<any>[];
            lifecycle?: Lifecycle;
        }
    ): this {
        this.registrations.push({
            token,
            useClass: provider.useClass,
            dependencies: provider.dependencies,
            lifecycle: provider.lifecycle,
        });
        return this;
    }

    public getRegistrations(): ProviderRegistration[] {
        return this.registrations;
    }
}

