import { CODE_MAX, TAG_LIST_MAX, TITLE_MAX } from '@/domain/limits';
import type { SnippetId } from '@/domain/snippets/SnippetId';

export class InvalidSnippet extends Error {
  constructor(reason: string) {
    super(`InvalidSnippet: ${reason}`);
    this.name = 'InvalidSnippet';
  }
}

export interface SnippetCreateInput {
  readonly id: SnippetId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly tags: readonly string[];
  readonly createdAt: Date;
}

export interface SnippetSnapshot {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly tags: readonly string[];
  readonly createdAt: number;
  readonly updatedAt: number;
}

interface SnippetProps {
  readonly id: SnippetId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly tags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export class Snippet {
  readonly id: SnippetId;
  readonly title: string;
  readonly code: string;
  readonly language: string;
  readonly tags: readonly string[];
  readonly createdAt: Date;
  readonly updatedAt: Date;

  private constructor(props: SnippetProps) {
    this.id = props.id;
    this.title = props.title;
    this.code = props.code;
    this.language = props.language;
    this.tags = props.tags;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(input: SnippetCreateInput): Snippet {
    requireNonEmpty(input.id, 'id');
    requireNonEmpty(input.language, 'language');
    requireFiniteDate(input.createdAt, 'createdAt');
    requireMaxLength(input.title, TITLE_MAX, 'title');
    requireMaxLength(input.code, CODE_MAX, 'code');
    requireTagList(input.tags, 'tags');

    const createdAt = new Date(input.createdAt);

    return new Snippet({
      id: input.id,
      title: input.title,
      code: input.code,
      language: input.language,
      tags: [...input.tags],
      createdAt,
      updatedAt: new Date(createdAt),
    });
  }

  static fromSnapshot(snapshot: SnippetSnapshot): Snippet {
    return new Snippet({
      id: snapshot.id as SnippetId,
      title: snapshot.title,
      code: snapshot.code,
      language: snapshot.language,
      tags: [...snapshot.tags],
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
      tags: [...this.tags],
      createdAt: this.createdAt.getTime(),
      updatedAt: this.updatedAt.getTime(),
    };
  }
}

function requireNonEmpty(value: string, field: string): void {
  if (value.trim().length === 0) {
    throw new InvalidSnippet(`${field} must not be empty`);
  }
}

function requireMaxLength(value: string, max: number, field: string): void {
  if (value.length > max) {
    throw new InvalidSnippet(`${field} must not exceed ${String(max)} characters`);
  }
}

function requireFiniteDate(value: Date, field: string): void {
  if (!Number.isFinite(value.getTime())) {
    throw new InvalidSnippet(`${field} must be a valid date`);
  }
}

function requireTagList(values: readonly string[], field: string): void {
  if (values.length > TAG_LIST_MAX) {
    throw new InvalidSnippet(`${field} must not contain more than ${String(TAG_LIST_MAX)} entries`);
  }
  const seen = new Set<string>();
  for (const value of values) {
    if (value.trim().length === 0) {
      throw new InvalidSnippet(`${field} entries must not be empty`);
    }
    if (seen.has(value)) {
      throw new InvalidSnippet(`${field} must not contain duplicates`);
    }
    seen.add(value);
  }
}
