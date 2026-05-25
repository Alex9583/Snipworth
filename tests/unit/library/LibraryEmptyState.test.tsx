import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { LibraryEmptyState } from '@/adapters/primary/library/LibraryEmptyState';
import { LIBRARY_EMPTY_STATE } from '@/adapters/primary/library/LibraryEmptyState.strings';

describe('LibraryEmptyState', () => {
  it('should_invoke_onCreateFirstDraft_when_user_clicks_the_primary_CTA', async () => {
    const user = userEvent.setup();
    const onCreateFirstDraft = vi.fn();

    render(<LibraryEmptyState onCreateFirstDraft={onCreateFirstDraft} onShowMe={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: LIBRARY_EMPTY_STATE.primaryCta }));

    expect(onCreateFirstDraft).toHaveBeenCalledOnce();
  });

  it('should_invoke_onShowMe_when_user_clicks_the_secondary_CTA', async () => {
    const user = userEvent.setup();
    const onShowMe = vi.fn();

    render(<LibraryEmptyState onCreateFirstDraft={vi.fn()} onShowMe={onShowMe} />);

    await user.click(screen.getByRole('button', { name: LIBRARY_EMPTY_STATE.secondaryCta }));

    expect(onShowMe).toHaveBeenCalledOnce();
  });
});
