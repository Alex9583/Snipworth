import { Draft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import type {
  CorruptDraftRow,
  CountAllDraftsOutcome,
  DeleteDraftOutcome,
  DraftRepository,
  FindAllDraftsOutcome,
  FindDraftOutcome,
  ReplaceAllDraftsOutcome,
  SaveDraftOutcome,
} from '@/application/ports/DraftRepository';

import { draftRowSchema } from './row-format';
import type { DraftRow, SnipworthDB } from './SnipworthDB';

export class DexieDraftRepository implements DraftRepository {
  constructor(private readonly database: SnipworthDB) {}

  async save(draft: Draft): Promise<SaveDraftOutcome> {
    try {
      await this.database.drafts.put(draft.toSnapshot());
      return { kind: 'saved' };
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
  }

  async findById(id: DraftId): Promise<FindDraftOutcome> {
    let raw: DraftRow | undefined;
    try {
      raw = await this.database.drafts.get(id);
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    if (raw === undefined) return { kind: 'not_found' };

    const parsed = draftRowSchema.safeParse(raw);
    if (!parsed.success) return { kind: 'corrupt', cause: parsed.error };
    return { kind: 'found', draft: Draft.fromSnapshot(parsed.data) };
  }

  async findAll(): Promise<FindAllDraftsOutcome> {
    let rows: DraftRow[];
    try {
      rows = await this.database.drafts.toArray();
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }

    const drafts: Draft[] = [];
    const corrupt: CorruptDraftRow[] = [];
    for (const row of rows) {
      const parsed = draftRowSchema.safeParse(row);
      if (parsed.success) {
        drafts.push(Draft.fromSnapshot(parsed.data));
      } else {
        corrupt.push({ id: rowId(row), cause: parsed.error });
      }
    }
    return { kind: 'loaded', drafts, corrupt };
  }

  async delete(id: DraftId): Promise<DeleteDraftOutcome> {
    try {
      await this.database.drafts.delete(id);
      return { kind: 'deleted' };
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
  }

  async replaceAll(drafts: readonly Draft[]): Promise<ReplaceAllDraftsOutcome> {
    const rows = drafts.map((draft) => draft.toSnapshot());
    try {
      await this.database.transaction('rw', this.database.drafts, async () => {
        await this.database.drafts.clear();
        if (rows.length > 0) {
          await this.database.drafts.bulkPut(rows);
        }
      });
      return { kind: 'replaced' };
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
  }

  async countAll(): Promise<CountAllDraftsOutcome> {
    try {
      const total = await this.database.drafts.count();
      return { kind: 'counted', total };
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
  }
}

function rowId(row: unknown): string {
  if (typeof row === 'object' && row !== null && 'id' in row) {
    const id: unknown = row.id;
    if (typeof id === 'string') return id;
  }
  return 'unknown';
}
