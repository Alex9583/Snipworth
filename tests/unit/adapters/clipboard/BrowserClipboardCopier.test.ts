import { describe, it, expect } from 'vitest';

import {
  BrowserClipboardCopier,
  type ClipboardItemCtor,
  type ClipboardWriteFn,
} from '@/adapters/secondary/clipboard/BrowserClipboardCopier';

class FakeClipboardItem {
  constructor(public readonly data: Record<string, ClipboardItemData>) {}
}

const FakeItemCtor = FakeClipboardItem as unknown as ClipboardItemCtor;

interface WriteCall {
  readonly items: readonly unknown[];
}

interface WriteSpy {
  readonly fn: ClipboardWriteFn;
  readonly calls: WriteCall[];
}

function spyWriteResolving(): WriteSpy {
  const calls: WriteCall[] = [];
  const fn: ClipboardWriteFn = async (items) => {
    calls.push({ items });
    await Promise.resolve();
  };
  return { fn, calls };
}

function rejectingWrite(cause: unknown): ClipboardWriteFn {
  return async () => {
    await Promise.resolve();
    throw cause;
  };
}

describe('BrowserClipboardCopier', () => {
  it('should_return_copied_and_pass_the_unresolved_blob_promise_to_the_clipboard_item_when_write_resolves', async () => {
    const writeSpy = spyWriteResolving();
    const copier = new BrowserClipboardCopier(writeSpy.fn, FakeItemCtor);
    const blob = new Blob(['png-bytes'], { type: 'image/png' });
    const blobPromise = Promise.resolve(blob);
    let factoryCalls = 0;
    const factory = (): Promise<Blob> => {
      factoryCalls += 1;
      return blobPromise;
    };

    const outcome = await copier.copyImage(factory);

    expect(outcome).toEqual({ kind: 'copied' });
    expect(factoryCalls).toBe(1);
    expect(writeSpy.calls).toHaveLength(1);
    const writtenItem = writeSpy.calls[0]?.items[0] as FakeClipboardItem;
    expect(writtenItem.data['image/png']).toBe(blobPromise);
  });

  it('should_return_denied_carrying_the_cause_when_write_rejects_with_a_not_allowed_error', async () => {
    const cause = Object.assign(new Error('Write permission denied'), {
      name: 'NotAllowedError',
    });
    const copier = new BrowserClipboardCopier(rejectingWrite(cause), FakeItemCtor);

    const outcome = await copier.copyImage(() => Promise.resolve(new Blob(['x'])));

    expect(outcome).toEqual({ kind: 'denied', cause });
  });

  it('should_return_copy_failed_carrying_the_cause_when_write_rejects_with_a_generic_error', async () => {
    const cause = new Error('clipboard service unavailable');
    const copier = new BrowserClipboardCopier(rejectingWrite(cause), FakeItemCtor);

    const outcome = await copier.copyImage(() => Promise.resolve(new Blob(['x'])));

    expect(outcome).toEqual({ kind: 'copy_failed', cause });
  });
});
