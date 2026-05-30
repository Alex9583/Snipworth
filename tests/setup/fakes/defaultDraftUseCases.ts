import { ArchiveDraft } from '@/application/use-cases/ArchiveDraft';
import { CountDrafts } from '@/application/use-cases/CountDrafts';
import { DeleteDraft } from '@/application/use-cases/DeleteDraft';
import { ExportAllDrafts } from '@/application/use-cases/ExportAllDrafts';
import { ImportDrafts } from '@/application/use-cases/ImportDrafts';
import { ListDrafts } from '@/application/use-cases/ListDrafts';
import { OpenDraft } from '@/application/use-cases/OpenDraft';
import { RestoreDraft } from '@/application/use-cases/RestoreDraft';
import { SaveCurrentEditorAsDraft } from '@/application/use-cases/SaveCurrentEditorAsDraft';
import { UpdateDraft } from '@/application/use-cases/UpdateDraft';

import { FakeClock } from './FakeClock';
import { FixedIdGenerator } from './FixedIdGenerator';
import { InMemoryDraftRepository } from './InMemoryDraftRepository';

export interface DefaultDraftUseCases {
  readonly saveDraft: SaveCurrentEditorAsDraft;
  readonly openDraft: OpenDraft;
  readonly updateDraft: UpdateDraft;
  readonly deleteDraft: DeleteDraft;
  readonly archiveDraft: ArchiveDraft;
  readonly restoreDraft: RestoreDraft;
  readonly listDrafts: ListDrafts;
  readonly exportAllDrafts: ExportAllDrafts;
  readonly importDrafts: ImportDrafts;
  readonly countDrafts: CountDrafts;
}

export function buildDefaultDraftUseCases(
  repository: InMemoryDraftRepository = new InMemoryDraftRepository(),
  clock: FakeClock = new FakeClock(),
  ids: FixedIdGenerator = new FixedIdGenerator('draft'),
): DefaultDraftUseCases {
  return {
    saveDraft: new SaveCurrentEditorAsDraft(repository, ids, clock),
    openDraft: new OpenDraft(repository),
    updateDraft: new UpdateDraft(repository, clock),
    deleteDraft: new DeleteDraft(repository),
    archiveDraft: new ArchiveDraft(repository, clock),
    restoreDraft: new RestoreDraft(repository, clock),
    listDrafts: new ListDrafts(repository),
    exportAllDrafts: new ExportAllDrafts(repository, clock),
    importDrafts: new ImportDrafts(repository, ids),
    countDrafts: new CountDrafts(repository),
  };
}
