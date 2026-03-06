import { IWordEntryRepository } from '../../infra/persistence/vocabulary/VocabularyFactories';
import { IReviewSessionRepository } from '../../infra/services/ReviewServices';

export class GetStatisticsUseCase {
    constructor(
        private wordRepo: IWordEntryRepository,
        private sessionRepo: IReviewSessionRepository
    ) {}

    execute(userId: string) {
        return { total: this.wordRepo.findAll().length };
    }
}
