import { act, renderHook } from '@testing-library/react';
import { useRef, type RefObject } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { usePreviewSize } from '@/adapters/primary/app/usePreviewSize';

type ResizeCallback = (entries: ResizeObserverEntry[]) => void;

class FakeResizeObserver {
  static instances: FakeResizeObserver[] = [];

  readonly callback: ResizeCallback;
  readonly observed: Element[] = [];
  disconnected = false;

  constructor(callback: ResizeCallback) {
    this.callback = callback;
    FakeResizeObserver.instances.push(this);
  }

  observe(target: Element): void {
    this.observed.push(target);
  }

  unobserve(): void {
    // not used by usePreviewSize
  }

  disconnect(): void {
    this.disconnected = true;
  }

  emit(width: number, height: number): void {
    const entry = { contentRect: { width, height } } as ResizeObserverEntry;
    this.callback([entry]);
  }
}

let originalResizeObserver: typeof globalThis.ResizeObserver | undefined;

beforeEach(() => {
  originalResizeObserver = globalThis.ResizeObserver;
  globalThis.ResizeObserver = FakeResizeObserver as unknown as typeof globalThis.ResizeObserver;
  FakeResizeObserver.instances = [];
});

afterEach(() => {
  if (originalResizeObserver !== undefined) {
    globalThis.ResizeObserver = originalResizeObserver;
  }
});

function renderHookWithRef() {
  return renderHook(() => {
    const ref = useRef<HTMLDivElement | null>(null);
    ref.current ??= document.createElement('div');
    const size = usePreviewSize(ref as RefObject<HTMLDivElement>);
    return { ref, size };
  });
}

describe('usePreviewSize', () => {
  it('should_return_null_before_the_observer_emits', () => {
    const { result } = renderHookWithRef();

    expect(result.current.size).toBeNull();
  });

  it('should_return_the_observed_dimensions_when_the_observer_emits', () => {
    const { result } = renderHookWithRef();

    act(() => {
      const observer = FakeResizeObserver.instances[0];
      observer?.emit(800, 540);
    });

    expect(result.current.size).toEqual({ width: 800, height: 540 });
  });

  it('should_update_the_dimensions_when_the_observer_emits_again', () => {
    const { result } = renderHookWithRef();

    act(() => {
      FakeResizeObserver.instances[0]?.emit(800, 540);
    });
    act(() => {
      FakeResizeObserver.instances[0]?.emit(1024, 720);
    });

    expect(result.current.size).toEqual({ width: 1024, height: 720 });
  });

  it('should_disconnect_the_observer_on_unmount', () => {
    const { unmount } = renderHookWithRef();

    const observer = FakeResizeObserver.instances[0];
    expect(observer?.disconnected).toBe(false);

    unmount();

    expect(observer?.disconnected).toBe(true);
  });
});
