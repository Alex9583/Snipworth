import type {
  CorruptDraftRow,
  DraftRepository,
  FindAllDraftsOutcome,
} from '@/application/ports/DraftRepository';
import type { DraftSnapshot, DraftStatus } from '@/domain/drafts/Draft';
import type { Platform } from '@/domain/drafts/Platform';

export interface ListDraftsFilters {
  readonly status?: DraftStatus;
  readonly search?: string;
  readonly platform?: Platform;
  readonly language?: string;
  readonly tags?: readonly string[];
}

export interface ListDraftsInput {
  readonly filters?: ListDraftsFilters;
}

export type ListDraftsOutcome =
  | {
      readonly kind: 'loaded';
      readonly snapshots: readonly DraftSnapshot[];
      readonly corrupt: readonly CorruptDraftRow[];
    }
  | { readonly kind: 'storage_unavailable'; readonly cause: unknown };

function normalizeFilterTags(tags: readonly string[] | undefined): Set<string> | undefined {
  if (tags === undefined || tags.length === 0) return undefined;
  return new Set(tags.map((t) => (t.startsWith('#') ? t.toLowerCase() : `#${t.toLowerCase()}`)));
}

function matchesSearch(snapshot: DraftSnapshot, term: string | undefined): boolean {
  if (term === undefined) return true;
  return (
    snapshot.title.toLowerCase().includes(term) ||
    snapshot.caption.toLowerCase().includes(term) ||
    snapshot.hashtags.some((h) => h.toLowerCase().includes(term))
  );
}

function hasAnyTag(snapshot: DraftSnapshot, wanted: Set<string>): boolean {
  return snapshot.hashtags.some((h) => wanted.has(h.toLowerCase()));
}

function filterSnapshots(
  snapshots: readonly DraftSnapshot[],
  filters: ListDraftsFilters | undefined,
): DraftSnapshot[] {
  const status = filters?.status ?? 'draft';
  const search = filters?.search?.toLowerCase();
  const platform = filters?.platform;
  const language = filters?.language;
  const wantedTags = normalizeFilterTags(filters?.tags);
  return snapshots.filter(
    (s) =>
      s.status === status &&
      matchesSearch(s, search) &&
      (platform === undefined || s.platform === platform) &&
      (language === undefined || s.language === language) &&
      (wantedTags === undefined || hasAnyTag(s, wantedTags)),
  );
}

function sortByRecency(snapshots: readonly DraftSnapshot[]): DraftSnapshot[] {
  return [...snapshots].sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
}

export class ListDrafts {
  constructor(private readonly repo: DraftRepository) {}

  async execute(input: ListDraftsInput): Promise<ListDraftsOutcome> {
    const found = await this.loadOrFail();
    if (found.kind === 'storage_unavailable') return found;
    const snapshots = found.drafts.map((d) => d.toSnapshot());
    const filtered = filterSnapshots(snapshots, input.filters);
    const sorted = sortByRecency(filtered);
    return { kind: 'loaded', snapshots: sorted, corrupt: found.corrupt };
  }

  private async loadOrFail(): Promise<FindAllDraftsOutcome> {
    try {
      return await this.repo.findAll();
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
  }
}
