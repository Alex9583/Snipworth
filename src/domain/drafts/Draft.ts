import { isPlatform, type Platform } from '@/domain/drafts/Platform';
import type { DraftId } from '@/domain/drafts/DraftId';
import { CAPTION_MAX, CODE_MAX, TAG_LIST_MAX, TITLE_MAX } from '@/domain/limits';
import { RenderConfig, type RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

export const draftStatuses = ['draft', 'published', 'archived'] as const;
export type DraftStatus = (typeof draftStatuses)[number];

export class InvalidDraft extends Error {
  constructor(reason: string) {
    super(`InvalidDraft: ${reason}`);
    this.name = 'InvalidDraft';
  }
}

export interface DraftCreateInput {
  readonly id: DraftId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly config: RenderConfig;
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly platform: Platform;
  readonly thumbnail: Blob | null;
  readonly tags: readonly string[];
  readonly createdAt: Date;
}

export interface DraftSnapshot {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly config: RenderConfigSnapshot;
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly platform: Platform;
  readonly thumbnail: Blob | null;
  readonly tags: readonly string[];
  readonly status: DraftStatus;
  readonly createdAt: number;
  readonly updatedAt: number;
}

interface DraftProps {
  readonly id: DraftId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly config: RenderConfig;
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly platform: Platform;
  readonly thumbnail: Blob | null;
  readonly tags: readonly string[];
  readonly status: DraftStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Draft {
  readonly id: DraftId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly config: RenderConfig;
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly platform: Platform;
  readonly thumbnail: Blob | null;
  readonly tags: readonly string[];
  readonly status: DraftStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: DraftProps) {
    this.id = props.id;
    this.title = props.title;
    this.code = props.code;
    this.language = props.language;
    this.config = props.config;
    this.caption = props.caption;
    this.hashtags = props.hashtags;
    this.platform = props.platform;
    this.thumbnail = props.thumbnail;
    this.tags = props.tags;
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input: DraftCreateInput): Draft {
    requireNonEmpty(input.id, 'id');
    requireNonEmpty(input.language, 'language');
    requirePlatform(input.platform);
    requireFiniteDate(input.createdAt, 'createdAt');
    requireMaxLength(input.title, TITLE_MAX, 'title');
    requireMaxLength(input.caption, CAPTION_MAX, 'caption');
    requireMaxLength(input.code, CODE_MAX, 'code');
    requireTagList(input.tags, 'tags');
    requireTagList(input.hashtags, 'hashtags');

    const createdAt = new Date(input.createdAt);

    return new Draft({
      id: input.id,
      title: input.title,
      code: input.code,
      language: input.language,
      config: input.config,
      caption: input.caption,
      hashtags: [...input.hashtags],
      platform: input.platform,
      thumbnail: input.thumbnail,
      tags: [...input.tags],
      status: 'draft',
      createdAt,
      updatedAt: new Date(createdAt),
    });
  }

  static fromSnapshot(snapshot: DraftSnapshot): Draft {
    return new Draft({
      id: snapshot.id as DraftId,
      title: snapshot.title,
      code: snapshot.code,
      language: snapshot.language,
      config: RenderConfig.fromSnapshot(snapshot.config),
      caption: snapshot.caption,
      hashtags: [...snapshot.hashtags],
      platform: snapshot.platform,
      thumbnail: snapshot.thumbnail,
      tags: [...snapshot.tags],
      status: snapshot.status,
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    });
  }

  toSnapshot(): DraftSnapshot {
    return {
      id: this.id,
      title: this.title,
      code: this.code,
      language: this.language,
      config: this.config.toSnapshot(),
      caption: this.caption,
      hashtags: [...this.hashtags],
      platform: this.platform,
      thumbnail: this.thumbnail,
      tags: [...this.tags],
      status: this.status,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }

  rename(title: string, now: Date): Draft {
    requireMaxLength(title, TITLE_MAX, 'title');
    return this.withUpdate({ title }, now);
  }

  updateCode(code: string, language: string, now: Date): Draft {
    requireNonEmpty(language, 'language');
    requireMaxLength(code, CODE_MAX, 'code');
    return this.withUpdate({ code, language }, now);
  }

  replaceConfig(config: RenderConfig, now: Date): Draft {
    return this.withUpdate({ config }, now);
  }

  private withUpdate(patch: Partial<DraftProps>, now: Date): Draft {
    requireFiniteDate(now, 'now');
    if (now.getTime() < this.createdAt.getTime()) {
      throw new InvalidDraft('updatedAt must not precede createdAt');
    }
    return new Draft({
      id: this.id,
      title: this.title,
      code: this.code,
      language: this.language,
      config: this.config,
      caption: this.caption,
      hashtags: this.hashtags,
      platform: this.platform,
      thumbnail: this.thumbnail,
      tags: this.tags,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: new Date(now),
      ...patch,
    });
  }
}

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new InvalidDraft(`${field} must not be empty`);
  }
}

function requireMaxLength(value: string, max: number, field: string): void {
  if (value.length > max) {
    throw new InvalidDraft(`${field} must not exceed ${String(max)} characters`);
  }
}

function requirePlatform(value: Platform): void {
  if (!isPlatform(value)) {
    throw new InvalidDraft(`platform "${String(value)}" is not supported`);
  }
}

function requireFiniteDate(value: Date, field: string): void {
  if (!Number.isFinite(value.getTime())) {
    throw new InvalidDraft(`${field} must be a valid date`);
  }
}

function requireTagList(values: readonly string[], field: string): void {
  if (values.length > TAG_LIST_MAX) {
    throw new InvalidDraft(`${field} must not contain more than ${String(TAG_LIST_MAX)} entries`);
  }
  const seen = new Set<string>();
  for (const value of values) {
    if (value.trim().length === 0) {
      throw new InvalidDraft(`${field} entries must not be empty`);
    }
    if (seen.has(value)) {
      throw new InvalidDraft(`${field} must not contain duplicates`);
    }
    seen.add(value);
  }
}
