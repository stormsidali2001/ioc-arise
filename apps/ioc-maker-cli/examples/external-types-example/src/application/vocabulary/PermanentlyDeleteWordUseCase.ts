import type { IWordEntryRepository } from '../shared/IWordEntryRepository';
import type { ITombstoneRepository } from '../replication/ports/ITombstoneRepository';

/**
 * @factory
 *
 * This factory has two deps:
 *  - IWordEntryRepository: declared locally → resolved normally
 *  - ITombstoneRepository: re-exported from an external package via a local stub
 *    → ioc-arise should still emit it as a dependency token
 */
export function createPermanentlyDeleteWordUseCase(deps: {
  wordEntryRepository: IWordEntryRepository;
  tombstoneRepository: ITombstoneRepository;
}) {
  return {
    execute(wordId: string) {
      deps.wordEntryRepository.save({ deleted: wordId });
    },
  };
}
