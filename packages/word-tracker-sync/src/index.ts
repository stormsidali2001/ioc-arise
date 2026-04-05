/**
 * @word-tracker/sync
 *
 * Simulates a shared package in a monorepo (e.g. a sync/replication domain package).
 * ioc-arise should be able to use types exported from here as DI tokens.
 */

export interface ITombstoneRepository {
  create(resourceId: string, deletedAt: Date): Promise<void>;
  findByResourceId(resourceId: string): Promise<ITombstone | undefined>;
  deleteAll(): Promise<void>;
}

export interface ITombstone {
  resourceId: string;
  deletedAt: Date;
}
