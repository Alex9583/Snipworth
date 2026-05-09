import { describe, expect, it } from 'vitest';

import {
  BrowserBlobDownloader,
  type CreateObjectURLFn,
  type RevokeObjectURLFn,
  type TriggerDownloadFn,
} from '@/adapters/secondary/download/BrowserBlobDownloader';

interface CreateUrlSpy {
  readonly fn: CreateObjectURLFn;
  readonly calls: Blob[];
}

function createUrlSpyResolving(returnUrl: string): CreateUrlSpy {
  const calls: Blob[] = [];
  const fn: CreateObjectURLFn = (blob) => {
    calls.push(blob);
    return returnUrl;
  };
  return { fn, calls };
}

interface RevokeUrlSpy {
  readonly fn: RevokeObjectURLFn;
  readonly calls: string[];
}

function revokeUrlSpyRecording(): RevokeUrlSpy {
  const calls: string[] = [];
  const fn: RevokeObjectURLFn = (url) => {
    calls.push(url);
  };
  return { fn, calls };
}

interface TriggerSpy {
  readonly fn: TriggerDownloadFn;
  readonly calls: { readonly url: string; readonly filename: string }[];
}

function triggerSpyRecording(): TriggerSpy {
  const calls: { readonly url: string; readonly filename: string }[] = [];
  const fn: TriggerDownloadFn = (url, filename) => {
    calls.push({ url, filename });
  };
  return { fn, calls };
}

function triggerSpyThrowing(cause: unknown): TriggerDownloadFn {
  return () => {
    throw cause;
  };
}

const A_BLOB = (): Blob => new Blob(['png-bytes'], { type: 'image/png' });

describe('BrowserBlobDownloader', () => {
  it('should_return_downloaded_when_trigger_succeeds', async () => {
    const downloader = new BrowserBlobDownloader(
      createUrlSpyResolving('blob:fake-url').fn,
      revokeUrlSpyRecording().fn,
      triggerSpyRecording().fn,
    );

    const outcome = await downloader.download(A_BLOB(), 'snipworth.png');

    expect(outcome).toEqual({ kind: 'downloaded' });
  });

  it('should_create_an_object_url_for_the_blob_and_pass_it_with_the_filename_to_trigger_download', async () => {
    const blob = A_BLOB();
    const createSpy = createUrlSpyResolving('blob:fake-url');
    const triggerSpy = triggerSpyRecording();
    const downloader = new BrowserBlobDownloader(
      createSpy.fn,
      revokeUrlSpyRecording().fn,
      triggerSpy.fn,
    );

    await downloader.download(blob, 'snipworth.png');

    expect(createSpy.calls).toEqual([blob]);
    expect(triggerSpy.calls).toEqual([{ url: 'blob:fake-url', filename: 'snipworth.png' }]);
  });

  it('should_release_the_object_url_when_trigger_succeeds', async () => {
    const revokeSpy = revokeUrlSpyRecording();
    const downloader = new BrowserBlobDownloader(
      createUrlSpyResolving('blob:fake-url').fn,
      revokeSpy.fn,
      triggerSpyRecording().fn,
    );

    await downloader.download(A_BLOB(), 'snipworth.png');

    expect(revokeSpy.calls).toEqual(['blob:fake-url']);
  });

  it('should_return_download_failed_carrying_the_cause_when_trigger_throws', async () => {
    const cause = new Error('anchor click rejected');
    const downloader = new BrowserBlobDownloader(
      createUrlSpyResolving('blob:fake-url').fn,
      revokeUrlSpyRecording().fn,
      triggerSpyThrowing(cause),
    );

    const outcome = await downloader.download(A_BLOB(), 'snipworth.png');

    expect(outcome).toEqual({ kind: 'download_failed', cause });
  });

  it('should_release_the_object_url_when_trigger_throws', async () => {
    const revokeSpy = revokeUrlSpyRecording();
    const downloader = new BrowserBlobDownloader(
      createUrlSpyResolving('blob:fake-url').fn,
      revokeSpy.fn,
      triggerSpyThrowing(new Error('boom')),
    );

    await downloader.download(A_BLOB(), 'snipworth.png');

    expect(revokeSpy.calls).toEqual(['blob:fake-url']);
  });
});
