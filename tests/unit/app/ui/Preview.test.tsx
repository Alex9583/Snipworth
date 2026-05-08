import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import type { Root } from 'hast';

import { Preview } from '@/adapters/primary/app/ui/Preview';

function shikiLikeHast(code: string, tokenClass = 'token-keyword'): Root {
  return {
    type: 'root',
    children: [
      {
        type: 'element',
        tagName: 'pre',
        properties: { className: ['shiki'] },
        children: [
          {
            type: 'element',
            tagName: 'code',
            properties: {},
            children: [
              {
                type: 'element',
                tagName: 'span',
                properties: { className: [tokenClass] },
                children: [{ type: 'text', value: code }],
              },
            ],
          },
        ],
      },
    ],
  };
}

describe('Preview', () => {
  it('should_render_text_content_when_given_a_hast_tree', () => {
    render(<Preview hast={shikiLikeHast('const answer = 42')} />);

    expect(screen.getByText('const answer = 42')).toBeInTheDocument();
  });

  it('should_preserve_pre_and_code_structure_from_hast', () => {
    const { container } = render(<Preview hast={shikiLikeHast('x')} />);

    expect(container.querySelector('pre > code')).not.toBeNull();
  });

  it('should_preserve_token_classes_from_hast_so_syntax_colors_reach_the_dom', () => {
    const { container } = render(<Preview hast={shikiLikeHast('const', 'token-keyword')} />);

    const span = container.querySelector('span');
    expect(span?.className).toContain('token-keyword');
  });

  it('should_expose_the_capture_target_node_via_ref', () => {
    const ref = createRef<HTMLDivElement>();

    render(<Preview hast={shikiLikeHast('y')} ref={ref} />);

    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});
