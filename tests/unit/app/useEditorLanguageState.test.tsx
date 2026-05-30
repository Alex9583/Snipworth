import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useEditorLanguageState } from '@/adapters/primary/app/useEditorLanguageState';
import { AutoDetectLanguage } from '@/application/use-cases/AutoDetectLanguage';
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

function anAutoDetect(language = 'typescript'): AutoDetectLanguage {
  return new AutoDetectLanguage(
    new StubLanguageDetector({ kind: 'detected', result: { language, relevance: 12 } }),
  );
}

describe('useEditorLanguageState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_start_idle_with_plaintext_when_no_capture_or_typing_has_happened', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader(), anAutoDetect()),
    );

    expect(result.current.language).toBe('plaintext');
    expect(result.current.detection).toEqual({ kind: 'idle' });
  });

  it('should_seed_code_and_language_when_a_capture_arrives', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader('python'), anAutoDetect()),
    );

    act(() => {
      inbox.dispatch(CapturedSelection.from({ code: 'print(1)', sourceUrl: undefined }));
    });

    expect(result.current.code).toBe('print(1)');
    expect(result.current.language).toBe('python');
    expect(result.current.detection).toEqual({ kind: 'auto-detected' });
  });

  it('should_expose_a_fallback_detection_when_detector_fails', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aFailingLoader(), anAutoDetect()),
    );

    act(() => {
      inbox.dispatch(CapturedSelection.from({ code: 'a', sourceUrl: undefined }));
    });

    expect(result.current.detection.kind).toBe('fallback');
    expect(result.current.language).toBe('plaintext');
  });

  it('should_emit_a_manual_detection_when_user_picks_a_language', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aFailingLoader(), anAutoDetect()),
    );

    act(() => {
      inbox.dispatch(CapturedSelection.from({ code: 'a', sourceUrl: undefined }));
    });
    expect(result.current.detection.kind).toBe('fallback');

    act(() => {
      result.current.pickLanguage('rust');
    });

    expect(result.current.detection).toEqual({ kind: 'manual' });
    expect(result.current.language).toBe('rust');
  });

  it('should_auto_detect_the_language_300_ms_after_the_user_starts_typing', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader(), anAutoDetect('rust')),
    );

    act(() => {
      result.current.setCode('fn main() {}');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.language).toBe('rust');
    expect(result.current.detection).toEqual({ kind: 'auto-detected' });
  });

  it('should_return_to_idle_with_plaintext_when_the_code_is_cleared_after_typing', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader(), anAutoDetect('rust')),
    );

    act(() => {
      result.current.setCode('fn main() {}');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(result.current.detection.kind).toBe('auto-detected');

    act(() => {
      result.current.setCode('');
    });

    expect(result.current.language).toBe('plaintext');
    expect(result.current.detection).toEqual({ kind: 'idle' });
  });

  it('should_not_run_auto_detection_after_the_user_has_manually_picked_a_language', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader(), anAutoDetect('rust')),
    );

    act(() => {
      result.current.pickLanguage('python');
    });
    act(() => {
      result.current.setCode('let mut count = 0;');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.language).toBe('python');
    expect(result.current.detection).toEqual({ kind: 'manual' });
  });

  it('should_re_detect_the_current_code_when_auto_detection_is_requested_after_a_manual_pick', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader(), anAutoDetect('rust')),
    );

    act(() => {
      result.current.setCode('fn main() {}');
    });
    act(() => {
      result.current.pickLanguage('go');
    });
    act(() => {
      result.current.requestAutoDetection();
    });

    expect(result.current.language).toBe('rust');
    expect(result.current.detection).toEqual({ kind: 'auto-detected' });
  });

  it('should_keep_the_manual_pick_visible_even_when_the_code_is_empty', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader(), anAutoDetect()),
    );

    act(() => {
      result.current.pickLanguage('go');
    });

    expect(result.current.language).toBe('go');
    expect(result.current.detection).toEqual({ kind: 'manual' });
  });

  it('should_resume_auto_detection_after_a_new_capture_arrives', () => {
    const inbox = new FakeCaptureInbox();
    const { result } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader('python'), anAutoDetect('rust')),
    );

    act(() => {
      result.current.pickLanguage('go');
    });
    act(() => {
      inbox.dispatch(CapturedSelection.from({ code: 'def hi():', sourceUrl: undefined }));
    });
    act(() => {
      result.current.setCode('fn main() {}');
    });
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current.language).toBe('rust');
    expect(result.current.detection).toEqual({ kind: 'auto-detected' });
  });

  it('should_unsubscribe_from_the_inbox_on_unmount', () => {
    const inbox = new FakeCaptureInbox();
    const { unmount } = renderHook(() =>
      useEditorLanguageState(inbox, aDetectingLoader(), anAutoDetect()),
    );

    expect(inbox.listenerCount).toBe(1);
    unmount();
    expect(inbox.listenerCount).toBe(0);
  });
});
