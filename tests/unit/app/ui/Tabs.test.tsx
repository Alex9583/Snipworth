import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Tabs } from '@/adapters/primary/app/ui/Tabs';

function StatefulHarness() {
  const [value, setValue] = useState('one');
  return (
    <Tabs value={value} onChange={setValue}>
      <Tabs.List label="Test sections">
        <Tabs.Trigger value="one">One</Tabs.Trigger>
        <Tabs.Trigger value="two">Two</Tabs.Trigger>
      </Tabs.List>
    </Tabs>
  );
}

describe('Tabs', () => {
  it('should_render_a_tab_role_for_each_trigger', () => {
    render(<StatefulHarness />);
    expect(screen.getByRole('tab', { name: 'One' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Two' })).toBeInTheDocument();
  });

  it('should_mark_the_matching_value_as_aria_selected', () => {
    render(<StatefulHarness />);
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'false');
  });

  it('should_select_the_clicked_trigger_when_user_clicks_it', async () => {
    const user = userEvent.setup();
    render(<StatefulHarness />);
    await user.click(screen.getByRole('tab', { name: 'Two' }));
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false');
  });

  it('should_reflect_a_new_value_prop_when_parent_re_renders_with_a_different_value', () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <Tabs value="one" onChange={onChange}>
        <Tabs.List label="Test sections">
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'true');

    rerender(
      <Tabs value="two" onChange={onChange}>
        <Tabs.List label="Test sections">
          <Tabs.Trigger value="one">One</Tabs.Trigger>
          <Tabs.Trigger value="two">Two</Tabs.Trigger>
        </Tabs.List>
      </Tabs>,
    );
    expect(screen.getByRole('tab', { name: 'Two' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'One' })).toHaveAttribute('aria-selected', 'false');
  });

  it('should_throw_when_a_trigger_is_rendered_outside_of_Tabs', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {
      // Suppress React's error boundary logging for the expected throw under test.
    });
    expect(() => render(<Tabs.Trigger value="orphan">Orphan</Tabs.Trigger>)).toThrow(
      /Tabs\.Trigger must be rendered inside <Tabs>/,
    );
    consoleError.mockRestore();
  });
});
