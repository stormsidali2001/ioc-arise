import { IWordEntryRepository } from '../persistence/vocabulary/VocabularyFactories';
import { IEventBus, IUuidGenerator } from '../shared/shared';

export interface SpacedRepetitionService {
    calculateNextReview(history: any[]): Date;
}

export interface ReviewSessionBuilderService {
    buildSession(userId: string): any;
}

export interface IReviewSessionRepository {
    save(session: any): void;
}

export class Sm2SpacedRepetitionService implements SpacedRepetitionService {
    calculateNextReview(history: any[]): Date {
        return new Date();
    }
}

export class PriorityReviewSessionBuilderService implements ReviewSessionBuilderService {
    buildSession(userId: string): any {
        return {};
    }
}

/** @factory */
export function createReviewSessionRepository(): IReviewSessionRepository {
    return { save: () => {} };
}

/** @factory */
export function createStartReviewSessionUseCase(
    wordRepo: IWordEntryRepository,
    sessionRepo: IReviewSessionRepository,
    builder: ReviewSessionBuilderService,
    uuid: IUuidGenerator
) {
    return (userId: string) => builder.buildSession(userId);
}

/** @factory */
export function createRecordAnswerUseCase(
    sessionRepo: IReviewSessionRepository,
    eventBus: IEventBus
) {
    return (answer: any) => {};
}

/** @factory */
export function createEndReviewSessionUseCase(
    sessionRepo: IReviewSessionRepository,
    eventBus: IEventBus
) {
    return (sessionId: string) => {};
}

/** @factory */
export function createOnReviewSessionEnded(
    wordRepo: IWordEntryRepository,
    spacedRepetition: SpacedRepetitionService
) {
    return (session: any) => {};
}

/** @value */
export const sm2StateStore = {
    history: []
};
