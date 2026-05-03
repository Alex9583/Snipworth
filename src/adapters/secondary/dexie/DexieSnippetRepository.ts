import { Snippet } from '@/domain/snippets/Snippet';
import type { SnippetId } from '@/domain/snippets/SnippetId';
import type {
  CorruptSnippetRow,
  DeleteSnippetOutcome,
  FindAllSnippetsOutcome,
  FindSnippetOutcome,
  SaveSnippetOutcome,
  SnippetFilter,
  SnippetRepository,
} from '@/application/ports/SnippetRepository';

import { snippetRowSchema } from './row-format';
import type { SnippetRow, SnipworthDB } from './SnipworthDB';

export class DexieSnippetRepository implements SnippetRepository {
  constructor(private readonly database: SnipworthDB) {}

  async save(snippet: Snippet): Promise<SaveSnippetOutcome> {
    try {
      await this.database.snippets.put(snippet.toSnapshot());
      return { kind: 'saved' };
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
  }

  async findById(id: SnippetId): Promise<FindSnippetOutcome> {
    let raw: SnippetRow | undefined;
    try {
      raw = await this.database.snippets.get(id);
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
    if (raw === undefined) return { kind: 'not_found' };

    const parsed = snippetRowSchema.safeParse(raw);
    if (!parsed.success) return { kind: 'corrupt', cause: parsed.error };
    return { kind: 'found', snippet: Snippet.fromSnapshot(parsed.data) };
  }

  async findAll(filter?: SnippetFilter): Promise<FindAllSnippetsOutcome> {
    let rows: SnippetRow[];
    try {
      rows =
        filter?.language !== undefined
          ? await this.database.snippets.where('language').equals(filter.language).toArray()
          : await this.database.snippets.toArray();
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }

    const snippets: Snippet[] = [];
    const corrupt: CorruptSnippetRow[] = [];
    for (const row of rows) {
      const parsed = snippetRowSchema.safeParse(row);
      if (parsed.success) {
        snippets.push(Snippet.fromSnapshot(parsed.data));
      } else {
        corrupt.push({ id: rowId(row), cause: parsed.error });
      }
    }
    return { kind: 'loaded', snippets, corrupt };
  }

  async delete(id: SnippetId): Promise<DeleteSnippetOutcome> {
    try {
      await this.database.snippets.delete(id);
      return { kind: 'deleted' };
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
