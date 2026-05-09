import type { CaptureHandler, CaptureInbox, Unsubscribe } from '@/application/ports/CaptureInbox';
import type { CapturedSelection } from '@/domain/capture/CapturedSelection';

export class FakeCaptureInbox implements CaptureInbox {
  private readonly handlers = new Set<CaptureHandler>();

  subscribe(handler: CaptureHandler): Unsubscribe {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  dispatch(selection: CapturedSelection): void {
    for (const handler of this.handlers) handler(selection);
  }

  get listenerCount(): number {
    return this.handlers.size;
  }
}
