import { describe, it, expect, beforeEach } from 'vitest';
import { queueStorageFault, readSession, resetChromeMock } from '../../../setup/chrome-mock';
import { ChromeStorageCaptureCourier } from '@/adapters/secondary/capture/ChromeStorageCaptureCourier';
import { PENDING_CAPTURE_KEY } from '@/adapters/secondary/capture/pendingCaptureKey';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';

beforeEach(() => {
  resetChromeMock();
});

describe('ChromeStorageCaptureCourier', () => {
  it('should_write_a_pending_capture_snapshot_to_session_storage_when_delivering', async () => {
    const courier = new ChromeStorageCaptureCourier();

    const outcome = await courier.deliver(
      CapturedSelection.from({
        code: 'const x = 1;',
        sourceUrl: 'https://example.com/page',
      }),
    );

    expect(outcome).toEqual({ kind: 'delivered' });
    expect(readSession(PENDING_CAPTURE_KEY)).toEqual({
      code: 'const x = 1;',
      sourceUrl: 'https://example.com/page',
    });
  });

  it('should_normalise_a_missing_source_url_to_null_in_storage', async () => {
    const courier = new ChromeStorageCaptureCourier();

    await courier.deliver(CapturedSelection.from({ code: 'a', sourceUrl: undefined }));

    expect(readSession(PENDING_CAPTURE_KEY)).toEqual({ code: 'a', sourceUrl: null });
  });

  it('should_return_storage_failed_with_cause_when_session_storage_set_rejects', async () => {
    const cause = new Error('quota exceeded');
    queueStorageFault({ area: 'session', op: 'set', cause });
    const courier = new ChromeStorageCaptureCourier();

    const outcome = await courier.deliver(
      CapturedSelection.from({ code: 'a', sourceUrl: undefined }),
    );

    expect(outcome).toEqual({ kind: 'storage_failed', cause });
  });
});
