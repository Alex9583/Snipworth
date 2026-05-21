import { Draft } from '@/domain/drafts/Draft';
import type { DraftId } from '@/domain/drafts/DraftId';
import { RenderConfig } from '@/domain/rendering/RenderConfig';

const DEFAULT_CREATED_AT = new Date('2026-05-15T10:00:00Z');

export function anActiveDraft(overrides: { id?: string } = {}): Draft {
  return Draft.create({
    id: (overrides.id ?? 'draft-1') as DraftId,
    title: 'Hello',
    code: 'const x = 1;',
    language: 'typescript',
    config: RenderConfig.default(),
    caption: '',
    hashtags: [],
    platform: 'x',
    thumbnail: null,
    createdAt: DEFAULT_CREATED_AT,
  });
}

export function anArchivedDraft(archivedAt: Date): Draft {
  return Draft.fromSnapshot({
    ...anActiveDraft().toSnapshot(),
    status: 'archived',
    updatedAt: archivedAt.getTime(),
  });
}
