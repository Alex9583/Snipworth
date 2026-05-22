import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';

import { useDebouncedCallback } from '@/adapters/primary/library/useDebouncedCallback';

describe('useDebouncedCallback', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_invoke_callback_once_with_the_final_value_when_called_multiple_times_within_the_debounce_window', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 250));

    act(() => {
      result.current('a');
      result.current('ab');
      result.current('abc');
    });
    act(() => {
      vi.advanceTimersByTime(250);
    });

    expect(callback).toHaveBeenCalledExactlyOnceWith('abc');
  });

  it('should_not_invoke_callback_when_time_advances_less_than_the_delay', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 250));

    act(() => {
      result.current('hello');
    });
    act(() => {
      vi.advanceTimersByTime(249);
    });

    expect(callback).not.toHaveBeenCalled();
  });

  it('should_return_a_referentially_stable_function_across_renders_when_the_delay_is_unchanged', () => {
    const { result, rerender } = renderHook(
      ({ cb }: { cb: (value: string) => void }) => useDebouncedCallback(cb, 250),
      { initialProps: { cb: vi.fn() } },
    );
    const first = result.current;

    rerender({ cb: vi.fn() });

    expect(result.current).toBe(first);
  });
});
