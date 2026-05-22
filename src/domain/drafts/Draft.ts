import { requireFiniteDate, requireMaxLength, requireNonEmpty } from '@/domain/invariants';
import { isPlatform, type Platform } from '@/domain/drafts/Platform';
import { aspectRatioForPlatform } from '@/domain/drafts/aspectRatioForPlatform';
import { DraftId } from '@/domain/drafts/DraftId';
import { normalizeHashtags } from '@/domain/hashtags/normalizeHashtags';
import { CAPTION_MAX, CODE_MAX, ID_MAX, TITLE_MAX } from '@/domain/limits';
import { RenderConfig, type RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

export const draftStatuses = ['draft', 'archived'] as const;
export type DraftStatus = (typeof draftStatuses)[number];

export class InvalidDraft extends Error {
  constructor(reason: string) {
    super(`InvalidDraft: ${reason}`);
    this.name = 'InvalidDraft';
  }
}

const fail = (reason: string): never => {
  throw new InvalidDraft(reason);
};

export interface DraftCreateInput {
  readonly id: DraftId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly config: RenderConfig;
  readonly caption: string;
  readonly hashtags: readonly string[];
  readonly platform: Platform;
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
    this.status = props.status;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input: DraftCreateInput): Draft {
    requireNonEmpty(input.id, 'id', fail);
    requireMaxLength(input.id, ID_MAX, 'id', fail);
    requireNonEmpty(input.language, 'language', fail);
    requireNonEmpty(input.code, 'code', fail);
    requirePlatform(input.platform);
    requireFiniteDate(input.createdAt, 'createdAt', fail);
    requireMaxLength(input.title, TITLE_MAX, 'title', fail);
    requireMaxLength(input.caption, CAPTION_MAX, 'caption', fail);
    requireMaxLength(input.code, CODE_MAX, 'code', fail);
    const hashtags = normalizeHashtags(input.hashtags, fail);

    const createdAt = new Date(input.createdAt);

    return new Draft({
      id: input.id,
      title: input.title,
      code: input.code,
      language: input.language,
      config: input.config,
      caption: input.caption,
      hashtags,
      platform: input.platform,
      status: 'draft',
      createdAt,
      updatedAt: new Date(createdAt),
    });
  }

  static fromSnapshot(snapshot: DraftSnapshot): Draft {
    return new Draft({
      id: DraftId.from(snapshot.id, fail),
      title: snapshot.title,
      code: snapshot.code,
      language: snapshot.language,
      config: RenderConfig.fromSnapshot(snapshot.config),
      caption: snapshot.caption,
      hashtags: [...snapshot.hashtags],
      platform: snapshot.platform,
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
      status: this.status,
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }

  rename(title: string, now: Date): Draft {
    requireMaxLength(title, TITLE_MAX, 'title', fail);
    return this.withUpdate({ title }, now);
  }

  updateCode(code: string, language: string, now: Date): Draft {
    requireNonEmpty(code, 'code', fail);
    requireNonEmpty(language, 'language', fail);
    requireMaxLength(code, CODE_MAX, 'code', fail);
    return this.withUpdate({ code, language }, now);
  }

  updateCaption(caption: string, now: Date): Draft {
    requireMaxLength(caption, CAPTION_MAX, 'caption', fail);
    return this.withUpdate({ caption }, now);
  }

  updateHashtags(hashtags: readonly string[], now: Date): Draft {
    return this.withUpdate({ hashtags: normalizeHashtags(hashtags, fail) }, now);
  }

  replaceConfig(config: RenderConfig, now: Date): Draft {
    return this.withUpdate({ config }, now);
  }

  switchPlatform(platform: Platform, now: Date): Draft {
    requirePlatform(platform);
    const config = this.config.withAspectRatio(aspectRatioForPlatform(platform));
    return this.withUpdate({ platform, config }, now);
  }

  archive(now: Date): Draft {
    return this.withUpdate({ status: 'archived' }, now);
  }

  restore(now: Date): Draft {
    return this.withUpdate({ status: 'draft' }, now);
  }

  private withUpdate(patch: Partial<DraftProps>, now: Date): Draft {
    requireFiniteDate(now, 'now', fail);
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
      hashtags: [...this.hashtags],
      platform: this.platform,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: new Date(now),
      ...patch,
    });
  }
}

function requirePlatform(value: Platform): void {
  if (!isPlatform(value)) {
    throw new InvalidDraft(`platform "${String(value)}" is not supported`);
  }
}
