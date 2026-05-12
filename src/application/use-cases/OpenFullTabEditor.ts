import type { CaptureCourier } from '@/application/ports/CaptureCourier';
import type { FullTabOpener } from '@/application/ports/FullTabOpener';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';

export type OpenFullTabEditorOutcome =
  | { readonly kind: 'opened'; readonly deliveredCode: boolean }
  | { readonly kind: 'open_failed'; readonly cause: unknown }
  | { readonly kind: 'deliver_failed'; readonly cause: unknown };

export class OpenFullTabEditor {
  constructor(
    private readonly courier: CaptureCourier,
    private readonly opener: FullTabOpener,
  ) {}

  async execute(code: string): Promise<OpenFullTabEditorOutcome> {
    const deliveredCode = code.length > 0;
    if (deliveredCode) {
      const delivery = await this.courier.deliver(
        CapturedSelection.from({ code, sourceUrl: undefined }),
      );
      if (delivery.kind === 'storage_failed') {
        return { kind: 'deliver_failed', cause: delivery.cause };
      }
    }
    const open = await this.opener.openFullTab();
    if (open.kind === 'open_failed') {
      return { kind: 'open_failed', cause: open.cause };
    }
    return { kind: 'opened', deliveredCode };
  }
}
