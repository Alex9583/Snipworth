import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import type { Root } from 'hast';

import { createHighlightCache } from '@/adapters/primary/app/highlightCache';
import { LiveCodeEditor } from '@/adapters/primary/app/LiveCodeEditor';

import { FakeSyntaxHighlighter } from '../../setup/fakes/FakeSyntaxHighlighter';

function aHastWithText(text: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: { 'data-testid': 'highlight-pre' },
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: {},
            children: [{ type: 'text', value: text }],
          },
        ],
      },
    ],
  };
}

async function renderAndFlush(ui: React.ReactElement): Promise<ReturnType<typeof render>> {
  let result!: ReturnType<typeof render>;
  await act(async () => {
    result = render(ui);
    await Promise.resolve();
  });
  return result;
}

class NeverResolvingHighlighter extends FakeSyntaxHighlighter {
  override highlight() {
    return new Promise<never>(() => {
      // intentionally never resolves to keep Suspense pending
    });
  }
}

describe('LiveCodeEditor', () => {
  it('should_render_a_textbox_role_with_the_provided_label', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    await renderAndFlush(
      <LiveCodeEditor
        value=""
        onChange={vi.fn()}
        language="typescript"
        theme="github-dark"
        getHighlight={getHighlight}
        label="Code"
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Code' })).toBeInTheDocument();
  });

  it('should_reflect_the_current_value_on_the_textarea', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    await renderAndFlush(
      <LiveCodeEditor
        value="const x = 1;"
        onChange={vi.fn()}
        language="typescript"
        theme="github-dark"
        getHighlight={getHighlight}
        label="Code"
      />,
    );

    expect(screen.getByRole('textbox', { name: 'Code' })).toHaveValue('const x = 1;');
  });

  it('should_show_the_placeholder_when_one_is_provided', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    await renderAndFlush(
      <LiveCodeEditor
        value=""
        onChange={vi.fn()}
        language="typescript"
        theme="github-dark"
        getHighlight={getHighlight}
        label="Code"
        placeholder="Paste your snippet"
      />,
    );

    expect(screen.getByPlaceholderText('Paste your snippet')).toBeInTheDocument();
  });

  it('should_call_onChange_with_the_new_string_when_the_user_changes_the_value', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);
    const onChange = vi.fn();

    await renderAndFlush(
      <LiveCodeEditor
        value=""
        onChange={onChange}
        language="typescript"
        theme="github-dark"
        getHighlight={getHighlight}
        label="Code"
      />,
    );

    fireEvent.change(screen.getByRole('textbox', { name: 'Code' }), {
      target: { value: 'hello' },
    });

    expect(onChange).toHaveBeenCalledWith('hello');
    expect(typeof onChange.mock.calls[0]?.[0]).toBe('string');
  });

  it('should_render_the_top_right_slot_when_one_is_provided', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    await renderAndFlush(
      <LiveCodeEditor
        value=""
        onChange={vi.fn()}
        language="typescript"
        theme="github-dark"
        getHighlight={getHighlight}
        label="Code"
        topRightSlot={<span data-testid="picker-slot">picker</span>}
      />,
    );

    expect(screen.getByTestId('picker-slot')).toBeInTheDocument();
  });

  it('should_render_the_highlighted_overlay_after_the_promise_resolves', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    highlighter.setNextResult({
      hast: aHastWithText('const x = 1;'),
      resolvedLanguage: 'typescript',
      resolvedTheme: 'github-dark',
    });
    const getHighlight = createHighlightCache(highlighter);

    await renderAndFlush(
      <LiveCodeEditor
        value="const x = 1;"
        onChange={vi.fn()}
        language="typescript"
        theme="github-dark"
        getHighlight={getHighlight}
        label="Code"
      />,
    );

    expect(screen.getByTestId('highlight-pre')).toBeInTheDocument();
  });

  it('should_mark_the_highlighted_overlay_as_aria_hidden_so_screen_readers_skip_it', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    highlighter.setNextResult({
      hast: aHastWithText('x'),
      resolvedLanguage: 'typescript',
      resolvedTheme: 'github-dark',
    });
    const getHighlight = createHighlightCache(highlighter);

    const { container } = await renderAndFlush(
      <LiveCodeEditor
        value="x"
        onChange={vi.fn()}
        language="typescript"
        theme="github-dark"
        getHighlight={getHighlight}
        label="Code"
      />,
    );

    const overlay = container.querySelector('[data-overlay="highlight"]');
    expect(overlay).not.toBeNull();
    expect(overlay).toHaveAttribute('aria-hidden', 'true');
  });

  it('should_render_a_plain_overlay_with_the_code_text_while_the_highlighter_is_pending', () => {
    const highlighter = new NeverResolvingHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    const { container } = render(
      <LiveCodeEditor
        value="never-resolved-code"
        onChange={vi.fn()}
        language="typescript"
        theme="github-dark"
        getHighlight={getHighlight}
        label="Code"
      />,
    );

    const fallback = container.querySelector('[data-overlay="plain"]');
    expect(fallback).not.toBeNull();
    expect(fallback).toHaveTextContent('never-resolved-code');
    expect(fallback).toHaveAttribute('aria-hidden', 'true');
  });
});
