import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SaveDraftButton } from '@/adapters/primary/library/SaveDraftButton';

const FIXED_NOW = new Date('2026-05-24T10:00:00Z');
const TWO_SECONDS_BEFORE_NOW = new Date(FIXED_NOW.getTime() - 2_000);

describe('SaveDraftButton', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_render_save_draft_label_with_the_shortcut_hint_when_binding_kind_is_scratch', () => {
    render(<SaveDraftButton binding={{ kind: 'scratch' }} modKey="mac" onSave={() => undefined} />);

    expect(screen.getByRole('button', { name: /Save draft.*⌘S/ })).toBeInTheDocument();
  });

  it('should_invoke_onSave_when_user_clicks_the_button_in_scratch_mode', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<SaveDraftButton binding={{ kind: 'scratch' }} modKey="mac" onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /Save draft.*⌘S/ }));

    expect(onSave).toHaveBeenCalledOnce();
  });

  it('should_render_saved_2_seconds_ago_label_when_binding_is_bound_idle_with_lastSavedAt_two_seconds_ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);

    render(
      <SaveDraftButton
        binding={{ kind: 'bound', lastSavedAt: TWO_SECONDS_BEFORE_NOW, saveStatus: 'idle' }}
        modKey="mac"
      />,
    );

    expect(screen.getByText(/Saved 2 seconds ago/)).toBeInTheDocument();
  });

  it('should_update_the_relative_time_label_after_ten_seconds_elapse_in_bound_idle_mode', () => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);

    render(
      <SaveDraftButton
        binding={{ kind: 'bound', lastSavedAt: TWO_SECONDS_BEFORE_NOW, saveStatus: 'idle' }}
        modKey="mac"
      />,
    );

    expect(screen.getByText(/Saved 2 seconds ago/)).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByText(/Saved 12 seconds ago/)).toBeInTheDocument();
  });

  it('should_render_saving_label_and_an_aria_busy_disabled_button_when_saveStatus_is_saving', () => {
    render(
      <SaveDraftButton
        binding={{ kind: 'bound', lastSavedAt: TWO_SECONDS_BEFORE_NOW, saveStatus: 'saving' }}
        modKey="mac"
      />,
    );

    const button = screen.getByRole('button', { name: /Saving/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');
  });

  it('should_render_save_failed_retry_label_and_invoke_onRetry_when_saveStatus_is_error', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <SaveDraftButton
        binding={{ kind: 'bound', lastSavedAt: TWO_SECONDS_BEFORE_NOW, saveStatus: 'error' }}
        modKey="mac"
        onRetry={onRetry}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Save failed — Retry/ }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('should_render_icon_only_with_an_aria_label_when_compact_prop_is_true', () => {
    render(
      <SaveDraftButton
        binding={{ kind: 'scratch' }}
        modKey="mac"
        onSave={() => undefined}
        compact
      />,
    );

    const button = screen.getByRole('button', { name: 'Save draft' });
    expect(button).toHaveAccessibleName('Save draft');
    expect(button).not.toHaveTextContent('Save draft');
  });

  it('should_invoke_onSave_and_preventDefault_when_meta_S_is_pressed_in_scratch_mode', () => {
    const onSave = vi.fn();
    render(<SaveDraftButton binding={{ kind: 'scratch' }} modKey="mac" onSave={onSave} />);

    const notCanceled = fireEvent.keyDown(document, { key: 's', metaKey: true });

    expect(onSave).toHaveBeenCalledOnce();
    expect(notCanceled).toBe(false);
  });

  it('should_invoke_onFlush_and_onShowSavedToast_and_preventDefault_when_meta_S_is_pressed_in_bound_idle_mode', () => {
    const onFlush = vi.fn();
    const onShowSavedToast = vi.fn();
    render(
      <SaveDraftButton
        binding={{ kind: 'bound', lastSavedAt: TWO_SECONDS_BEFORE_NOW, saveStatus: 'idle' }}
        modKey="mac"
        onFlush={onFlush}
        onShowSavedToast={onShowSavedToast}
      />,
    );

    const notCanceled = fireEvent.keyDown(document, { key: 's', metaKey: true });

    expect(onFlush).toHaveBeenCalledOnce();
    expect(onShowSavedToast).toHaveBeenCalledOnce();
    expect(notCanceled).toBe(false);
  });
});
