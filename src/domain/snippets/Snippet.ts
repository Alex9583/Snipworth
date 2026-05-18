import { normalizeHashtags } from '@/domain/hashtags/normalizeHashtags';
import { requireFiniteDate, requireMaxLength, requireNonEmpty } from '@/domain/invariants';
import { CODE_MAX, ID_MAX, TITLE_MAX } from '@/domain/limits';
import { SnippetId } from '@/domain/snippets/SnippetId';

export class InvalidSnippet extends Error {
  constructor(reason: string) {
    super(`InvalidSnippet: ${reason}`);
    this.name = 'InvalidSnippet';
  }
}

const fail = (reason: string): never => {
  throw new InvalidSnippet(reason);
};

export interface SnippetCreateInput {
  readonly id: SnippetId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly hashtags: readonly string[];
  readonly createdAt: Date;
}

export interface SnippetSnapshot {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly hashtags: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

interface SnippetProps {
  readonly id: SnippetId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly hashtags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Snippet {
  readonly id: SnippetId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly hashtags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: SnippetProps) {
    this.id = props.id;
    this.title = props.title;
    this.code = props.code;
    this.language = props.language;
    this.hashtags = props.hashtags;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input: SnippetCreateInput): Snippet {
    requireNonEmpty(input.id, 'id', fail);
    requireMaxLength(input.id, ID_MAX, 'id', fail);
    requireNonEmpty(input.language, 'language', fail);
    requireFiniteDate(input.createdAt, 'createdAt', fail);
    requireMaxLength(input.title, TITLE_MAX, 'title', fail);
    requireMaxLength(input.code, CODE_MAX, 'code', fail);
    const hashtags = normalizeHashtags(input.hashtags, fail);

    const createdAt = new Date(input.createdAt);

    return new Snippet({
      id: input.id,
      title: input.title,
      code: input.code,
      language: input.language,
      hashtags,
      createdAt,
      updatedAt: new Date(createdAt),
    });
  }

  static fromSnapshot(snapshot: SnippetSnapshot): Snippet {
    return new Snippet({
      id: SnippetId.from(snapshot.id, fail),
      title: snapshot.title,
      code: snapshot.code,
      language: snapshot.language,
      hashtags: [...snapshot.hashtags],
      createdAt: new Date(snapshot.createdAt),
      updatedAt: new Date(snapshot.updatedAt),
    });
  }

  toSnapshot(): SnippetSnapshot {
    return {
      id: this.id,
      title: this.title,
      code: this.code,
      language: this.language,
      hashtags: [...this.hashtags],
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}
