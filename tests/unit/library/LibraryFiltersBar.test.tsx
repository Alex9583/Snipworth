import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LibraryFiltersBar } from '@/adapters/primary/library/LibraryFiltersBar';
import { LIBRARY_FILTERS_BAR } from '@/adapters/primary/library/LibraryFiltersBar.strings';
import { platformDisplayLabel } from '@/adapters/primary/library/platformLabels';

type BarProps = ComponentProps<typeof LibraryFiltersBar>;

function renderBar(overrides: Partial<BarProps> = {}) {
  const defaults: BarProps = {
    onSearchChange: vi.fn(),
    onPlatformChange: vi.fn(),
    onLanguageChange: vi.fn(),
    languageOptions: [],
    onTagChange: vi.fn(),
    tagOptions: [],
    onNewDraft: vi.fn(),
    onStatusFilterChange: vi.fn(),
  };
  return render(<LibraryFiltersBar {...defaults} {...overrides} />);
}

describe('LibraryFiltersBar', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should_invoke_onSearchChange_once_with_the_final_value_after_the_debounce_window_elapses', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    const onSearchChange = vi.fn();

    renderBar({ onSearchChange });

    await user.type(
      screen.getByRole('searchbox', { name: LIBRARY_FILTERS_BAR.searchLabel }),
      'hello',
    );
    await act(async () => {
      vi.advanceTimersByTime(300);
      await Promise.resolve();
    });

    expect(onSearchChange).toHaveBeenCalledExactlyOnceWith('hello');
  });

  it('should_invoke_onPlatformChange_with_linkedin_when_user_selects_linkedin_from_the_platform_dropdown', async () => {
    const user = userEvent.setup();
    const onPlatformChange = vi.fn();

    renderBar({ onPlatformChange });

    await user.click(screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.platformLabel }));
    await user.click(screen.getByRole('menuitem', { name: platformDisplayLabel('linkedin') }));

    expect(onPlatformChange).toHaveBeenCalledExactlyOnceWith('linkedin');
  });

  it('should_invoke_onLanguageChange_with_the_selected_language_when_user_selects_from_the_language_dropdown', async () => {
    const user = userEvent.setup();
    const onLanguageChange = vi.fn();

    renderBar({ onLanguageChange, languageOptions: ['typescript', 'python'] });

    await user.click(screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.languageLabel }));
    await user.click(screen.getByRole('menuitem', { name: 'typescript' }));

    expect(onLanguageChange).toHaveBeenCalledExactlyOnceWith('typescript');
  });

  it('should_invoke_onTagChange_with_the_selected_tag_when_user_selects_from_the_tags_dropdown', async () => {
    const user = userEvent.setup();
    const onTagChange = vi.fn();

    renderBar({ onTagChange, tagOptions: ['work', 'snippet'] });

    await user.click(screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.tagsLabel }));
    await user.click(screen.getByRole('menuitem', { name: 'work' }));

    expect(onTagChange).toHaveBeenCalledExactlyOnceWith('work');
  });

  it('should_invoke_onNewDraft_when_user_clicks_the_new_draft_button', async () => {
    const user = userEvent.setup();
    const onNewDraft = vi.fn();

    renderBar({ onNewDraft });

    await user.click(screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.newDraftButton }));

    expect(onNewDraft).toHaveBeenCalledOnce();
  });

  it('should_invoke_onStatusFilterChange_with_archived_when_user_selects_archived_from_the_status_dropdown', async () => {
    const user = userEvent.setup();
    const onStatusFilterChange = vi.fn();

    renderBar({ onStatusFilterChange });

    await user.click(screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.statusLabel }));
    await user.click(
      screen.getByRole('menuitem', { name: LIBRARY_FILTERS_BAR.statusOptions.archived }),
    );

    expect(onStatusFilterChange).toHaveBeenCalledExactlyOnceWith('archived');
  });

  it('should_render_the_export_all_zip_button_as_disabled_in_V1_0', () => {
    renderBar();

    expect(
      screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.exportAllButton }),
    ).toBeDisabled();
  });

  it('should_close_the_currently_open_dropdown_when_user_opens_another_dropdown', async () => {
    const user = userEvent.setup();

    renderBar();

    await user.click(screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.platformLabel }));
    expect(
      screen.getByRole('menu', { name: LIBRARY_FILTERS_BAR.platformLabel }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.languageLabel }));

    expect(
      screen.queryByRole('menu', { name: LIBRARY_FILTERS_BAR.platformLabel }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('menu', { name: LIBRARY_FILTERS_BAR.languageLabel }),
    ).toBeInTheDocument();
  });

  it('should_close_an_open_dropdown_when_user_clicks_outside_of_it', async () => {
    const user = userEvent.setup();

    renderBar();

    await user.click(screen.getByRole('button', { name: LIBRARY_FILTERS_BAR.platformLabel }));
    expect(
      screen.getByRole('menu', { name: LIBRARY_FILTERS_BAR.platformLabel }),
    ).toBeInTheDocument();

    await user.click(document.body);

    expect(
      screen.queryByRole('menu', { name: LIBRARY_FILTERS_BAR.platformLabel }),
    ).not.toBeInTheDocument();
  });
});
