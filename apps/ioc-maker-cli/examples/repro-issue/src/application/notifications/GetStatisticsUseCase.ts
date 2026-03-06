import { WordStatisticsService } from '../stats/WordStatisticsService';
import { ILogger, AppConfig } from '../../infra/config/appConfig';

export class GetStatisticsUseCase {
    constructor(
        private statsService: WordStatisticsService,
        private logger: ILogger,
        private config: AppConfig
    ) {}
    
    execute() {
        const stats = this.statsService.calculateStats();
        this.logger.log(`Env: ${this.config.env}, Stats: ${JSON.stringify(stats)}`);
        return stats;
    }
}
