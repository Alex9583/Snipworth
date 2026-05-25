import { Dexie, type EntityTable } from 'dexie';

import type { DraftSnapshot } from '@/domain/drafts/Draft';
import type { SnippetSnapshot } from '@/domain/snippets/Snippet';

export type DraftRow = DraftSnapshot;
export type SnippetRow = SnippetSnapshot;

export const SNIPWORTH_DB_NAME = 'SnipworthDB';

export type SnipworthDB = Dexie & {
  drafts: EntityTable<DraftRow, 'id'>;
  snippets: EntityTable<SnippetRow, 'id'>;
};

export function createSnipworthDB(name: string = SNIPWORTH_DB_NAME): SnipworthDB {
  const instance = new Dexie(name) as SnipworthDB;
  instance.version(1).stores({
    drafts: 'id, platform, status, updatedAt, *hashtags',
    snippets: 'id, language, updatedAt, *hashtags',
  });
  return instance;
}
