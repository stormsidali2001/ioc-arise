import { GetStatisticsUseCase } from '../statistics/GetStatisticsUseCase';

export interface INotificationDecisionService {
    shouldNotify(userId: string): boolean;
}

export interface INotificationContentBuilder {
    build(stats: any): string;
}

export interface ILocalNotificationScheduler {
    schedule(message: string): void;
}

export interface IUserNotificationPreferencesRepository {
    getPreferences(userId: string): any;
}

export class NotificationDecisionService implements INotificationDecisionService {
    constructor(private prefsRepo: IUserNotificationPreferencesRepository) {}
    shouldNotify(userId: string) { return true; }
}

export class NotificationContentBuilder implements INotificationContentBuilder {
    build(stats: any) { return 'Content'; }
}

export class ExpoLocalNotificationScheduler implements ILocalNotificationScheduler {
    schedule(message: string) {}
}

export class AsyncStorageNotificationPreferencesRepository implements IUserNotificationPreferencesRepository {
    getPreferences(userId: string) { return {}; }
}

export type ScheduleDailyReviewReminderUseCase = (userId: string) => void;

/** @factory */
export function createScheduleDailyReviewReminderUseCase(
    decisionService: INotificationDecisionService,
    prefsRepo: IUserNotificationPreferencesRepository,
    getStatsUseCase: GetStatisticsUseCase,
    contentBuilder: INotificationContentBuilder,
    scheduler: ILocalNotificationScheduler
): ScheduleDailyReviewReminderUseCase {
    return (userId: string) => {
        const stats = getStatsUseCase.execute(userId);
        scheduler.schedule(contentBuilder.build(stats));
    };
}

/** @factory */
export function createOnReviewSessionEndedDailyReminder(scheduleUseCase: ScheduleDailyReviewReminderUseCase) {
    return (userId: string) => scheduleUseCase(userId);
}
