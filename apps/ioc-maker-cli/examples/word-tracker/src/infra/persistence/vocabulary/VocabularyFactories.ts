import { IEventBus, IUuidGenerator } from '../../shared/shared';

export interface IWordEntryRepository {
    save(word: any): void;
    findAll(): any[];
}

export interface ISourceRepository {
    save(source: any): void;
    findAll(): any[];
}

/** @factory */
export function createWordEntryRepository(): IWordEntryRepository {
    return { save: () => {}, findAll: () => [] };
}

/** @factory */
export function createSourceRepository(): ISourceRepository {
    return { save: () => {}, findAll: () => [] };
}

/** @factory */
export function createAddWordUseCase(repo: IWordEntryRepository, bus: IEventBus, uuid: IUuidGenerator) {
    return (word: any) => {
        repo.save(word);
        bus.publish('word_added', word);
    };
}

/** @factory */
export function createGetWordUseCase(repo: IWordEntryRepository) {
    return (id: string) => repo.findAll().find(w => w.id === id);
}

/** @factory */
export function createSearchWordsUseCase(repo: IWordEntryRepository) {
    return (query: string) => repo.findAll();
}

/** @factory */
export function createUpdateWordUseCase(repo: IWordEntryRepository) {
    return (word: any) => repo.save(word);
}

/** @factory */
export function createGetAllWordsUseCase(repo: IWordEntryRepository) {
    return () => repo.findAll();
}

/** @factory */
export function createDeleteWordUseCase(repo: IWordEntryRepository) {
    return (id: string) => {};
}

/** @factory */
export function createCreateSourceUseCase(repo: ISourceRepository, uuid: IUuidGenerator) {
    return (source: any) => repo.save(source);
}

/** @factory */
export function createGetAllSourcesUseCase(repo: ISourceRepository) {
    return () => repo.findAll();
}

/** @factory */
export function createUpdateSourceUseCase(repo: ISourceRepository) {
    return (source: any) => repo.save(source);
}

/** @factory */
export function createDeleteSourceUseCase(repo: ISourceRepository) {
    return (id: string) => {};
}
