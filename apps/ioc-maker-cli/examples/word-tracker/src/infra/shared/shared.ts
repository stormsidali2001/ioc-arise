export interface IEventBus {
    publish(event: string, data: any): void;
}

export interface IUuidGenerator {
    generate(): string;
}

/** @value */
export const eventBus: IEventBus = {
    publish: () => {}
};

/** @value */
export const uuidGenerator: IUuidGenerator = {
    generate: () => 'uuid'
};
