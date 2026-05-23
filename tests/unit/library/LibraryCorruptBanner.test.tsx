import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { LibraryCorruptBanner } from '@/adapters/primary/library/LibraryCorruptBanner';
import {
  LIBRARY_CORRUPT_BANNER,
  messageWithCount,
} from '@/adapters/primary/library/LibraryCorruptBanner.strings';

describe('LibraryCorruptBanner', () => {
  it('should_render_the_banner_with_the_count_and_a_report_button_when_count_is_3', () => {
    render(<LibraryCorruptBanner count={3} onReport={vi.fn()} />);

    expect(screen.getByText(messageWithCount(3))).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: LIBRARY_CORRUPT_BANNER.reportButton }),
    ).toBeInTheDocument();
  });

  it('should_render_nothing_when_count_is_zero', () => {
    const { container } = render(<LibraryCorruptBanner count={0} onReport={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('should_invoke_onReport_when_user_clicks_the_report_button', async () => {
    const user = userEvent.setup();
    const onReport = vi.fn();

    render(<LibraryCorruptBanner count={1} onReport={onReport} />);

    await user.click(screen.getByRole('button', { name: LIBRARY_CORRUPT_BANNER.reportButton }));

    expect(onReport).toHaveBeenCalledOnce();
  });
});
