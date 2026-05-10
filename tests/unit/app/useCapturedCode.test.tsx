import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCapturedCode } from '@/adapters/primary/app/useCapturedCode';
import { LoadCapturedCode } from '@/application/use-cases/LoadCapturedCode';
import { CapturedSelection } from '@/domain/capture/CapturedSelection';

import { FakeCaptureInbox } from '../../setup/fakes/FakeCaptureInbox';
import { StubLanguageDetector } from '../../setup/fakes/StubLanguageDetector';

function aDetectingLoader(language = 'typescript'): LoadCapturedCode {
  return new LoadCapturedCode(
    new StubLanguageDetector({ kind: 'detected', result: { language, relevance: 12 } }),
  );
}

function aFailingLoader(): LoadCapturedCode {
  return new LoadCapturedCode(
    new StubLanguageDetector({ kind: 'detection_failed', cause: new Error('boom') }),
  );
}

describe('useCapturedCode', () => {
  it('should_seed_code_and_language_when_a_capture_arrives', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() => useCapturedCode(inbox, aDetectingLoader('python')));

    act(() => {
      inbox.dispatch(CapturedSelection.from({ code: 'print(1)', sourceUrl: undefined }));
    });

    expect(result.current.code).toBe('print(1)');
    expect(result.current.language).toBe('python');
    expect(result.current.detection).toEqual({ kind: 'detected' });
  });

  it('should_expose_a_fallback_detection_when_detector_fails', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() => useCapturedCode(inbox, aFailingLoader()));

    act(() => {
      inbox.dispatch(CapturedSelection.from({ code: 'a', sourceUrl: undefined }));
    });

    expect(result.current.detection.kind).toBe('fallback');
    expect(result.current.language).toBe('plaintext');
  });

  it('should_clear_the_fallback_detection_when_user_picks_a_language', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() => useCapturedCode(inbox, aFailingLoader()));

    act(() => {
      inbox.dispatch(CapturedSelection.from({ code: 'a', sourceUrl: undefined }));
    });
    expect(result.current.detection.kind).toBe('fallback');

    act(() => {
      result.current.pickLanguage('rust');
    });

    expect(result.current.detection).toEqual({ kind: 'detected' });
    expect(result.current.language).toBe('rust');
  });

  it('should_unsubscribe_from_the_inbox_on_unmount', () => {
    const inbox = new FakeCaptureInbox();
    const { unmount } = renderHook(() => useCapturedCode(inbox, aDetectingLoader()));

    expect(inbox.listenerCount).toBe(1);
    unmount();
    expect(inbox.listenerCount).toBe(0);
  });
});
