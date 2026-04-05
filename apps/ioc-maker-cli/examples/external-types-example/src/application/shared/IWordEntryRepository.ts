// Local interface — ioc-arise resolves this normally
export interface IWordEntryRepository {
  save(word: unknown): void;
  findAll(): unknown[];
}
