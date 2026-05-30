import type { CountAllDraftsOutcome, DraftRepository } from '@/application/ports/DraftRepository';

export type CountDraftsOutcome = CountAllDraftsOutcome;

export class CountDrafts {
  constructor(private readonly repo: DraftRepository) {}

  async execute(): Promise<CountDraftsOutcome> {
    try {
      return await this.repo.countAll();
    } catch (cause) {
      return { kind: 'storage_unavailable', cause };
    }
  }
}
