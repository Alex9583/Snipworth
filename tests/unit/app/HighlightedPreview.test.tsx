import { Suspense, useRef, useState, type Ref } from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Root } from 'hast';

import { createHighlightCache } from '@/adapters/primary/app/highlightCache';
import { HighlightedPreview } from '@/adapters/primary/app/HighlightedPreview';

import { FakeSyntaxHighlighter } from '../../setup/fakes/FakeSyntaxHighlighter';

const FALLBACK_TEXT = 'Loading preview…';

function aHastWithText(text: string): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: {},
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

describe('HighlightedPreview', () => {
  it('should_render_the_highlighted_hast_after_the_promise_resolves', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    highlighter.setNextResult({
      hast: aHastWithText('const x = 1;'),
      resolvedLanguage: 'typescript',
      resolvedTheme: 'github-dark',
    });
    const getHighlight = createHighlightCache(highlighter);

    await renderAndFlush(
      <Suspense fallback={<p>{FALLBACK_TEXT}</p>}>
        <HighlightedPreview
          getHighlight={getHighlight}
          code="const x = 1;"
          language="typescript"
          theme="github-dark"
        />
      </Suspense>,
    );

    expect(screen.getByText('const x = 1;')).toBeInTheDocument();
  });

  it('should_show_the_suspense_fallback_while_the_promise_is_pending', () => {
    const highlighter = new SlowSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    render(
      <Suspense fallback={<p>{FALLBACK_TEXT}</p>}>
        <HighlightedPreview
          getHighlight={getHighlight}
          code="x"
          language="typescript"
          theme="github-dark"
        />
      </Suspense>,
    );

    expect(screen.getByText(FALLBACK_TEXT)).toBeInTheDocument();
  });

  it('should_re_use_the_cached_promise_when_inputs_do_not_change', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    const { rerender } = await renderAndFlush(
      <Suspense fallback={<p>{FALLBACK_TEXT}</p>}>
        <HighlightedPreview
          getHighlight={getHighlight}
          code="x"
          language="typescript"
          theme="github-dark"
        />
      </Suspense>,
    );
    await act(async () => {
      rerender(
        <Suspense fallback={<p>{FALLBACK_TEXT}</p>}>
          <HighlightedPreview
            getHighlight={getHighlight}
            code="x"
            language="typescript"
            theme="github-dark"
          />
        </Suspense>,
      );
      await Promise.resolve();
    });

    expect(highlighter.calls).toHaveLength(1);
  });

  it('should_request_a_new_highlight_when_the_code_changes', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    function Driver() {
      const [code, setCode] = useState('a');
      return (
        <>
          <button
            onClick={() => {
              setCode('b');
            }}
          >
            change
          </button>
          <Suspense fallback={<p>{FALLBACK_TEXT}</p>}>
            <HighlightedPreview
              getHighlight={getHighlight}
              code={code}
              language="typescript"
              theme="github-dark"
            />
          </Suspense>
        </>
      );
    }

    const user = userEvent.setup();
    await renderAndFlush(<Driver />);
    await user.click(screen.getByRole('button', { name: 'change' }));

    expect(highlighter.calls).toHaveLength(2);
  });

  it('should_forward_a_ref_to_the_inner_preview_dom_node', async () => {
    const highlighter = new FakeSyntaxHighlighter();
    const getHighlight = createHighlightCache(highlighter);

    function Probe({ refTarget }: { refTarget: Ref<HTMLDivElement> }) {
      return (
        <Suspense fallback={<p>{FALLBACK_TEXT}</p>}>
          <HighlightedPreview
            getHighlight={getHighlight}
            code="x"
            language="typescript"
            theme="github-dark"
            ref={refTarget}
          />
        </Suspense>
      );
    }

    function Harness() {
      const ref = useRef<HTMLDivElement>(null);
      return (
        <>
          <Probe refTarget={ref} />
          <button
            onClick={() => {
              ref.current?.setAttribute('data-probed', 'yes');
            }}
          >
            probe
          </button>
        </>
      );
    }

    const user = userEvent.setup();
    const { container } = await renderAndFlush(<Harness />);
    await user.click(screen.getByRole('button', { name: 'probe' }));

    expect(container.querySelector('[data-probed="yes"]')).not.toBeNull();
  });
});

class SlowSyntaxHighlighter extends FakeSyntaxHighlighter {
  override highlight() {
    return new Promise<never>(() => {
      // never resolves
    });
  }
}
