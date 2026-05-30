import { describe, it, expect } from 'vitest';
import {
  InvalidRenderConfig,
  RenderConfig,
  type RenderConfigInput,
  type RenderConfigSnapshot,
} from '@/domain/rendering/RenderConfig';

const validInput: RenderConfigInput = {
  theme: 'github-dark',
  fontFamily: 'JetBrains Mono',
  fontSize: 14,
  lineHeight: 1.5,
  borderRadius: 8,
  background: { type: 'solid', color: '#1e1e1e' },
  canvasBackground: { type: 'solid', color: '#1e1e1e' },
  canvasPadding: 10,
  titleColor: '#a0a0a0',
  titleFontSize: 12,
  showWindowControls: true,
  windowStyle: 'mac',
  showLineNumbers: false,
  firstLineNumber: 1,
  highlightLines: [],
  shadow: true,
  shadowBlur: 10,
  shadowOffsetY: 4,
  aspectRatio: { kind: 'auto' },
  exportScale: 2,
  exportFormat: 'png',
};

describe('RenderConfig.default', () => {
  it('should_provide_the_specification_baseline_render_config', () => {
    const config = RenderConfig.default();
    expect(config.theme).toBe('github-dark');
    expect(config.fontFamily).toBe('JetBrains Mono');
    expect(config.fontSize).toBe(14);
    expect(config.lineHeight).toBe(1.5);
    expect(config.borderRadius).toBe(10);
    expect(config.background).toEqual({ type: 'solid', color: '#1C1C21' });
    expect(config.canvasBackground).toEqual({ type: 'solid', color: '#1C1C21' });
    expect(config.canvasPadding).toBe(10);
    expect(config.showWindowControls).toBe(true);
    expect(config.windowStyle).toBe('mac');
    expect(config.showLineNumbers).toBe(false);
    expect(config.firstLineNumber).toBe(1);
    expect(config.highlightLines).toEqual([]);
    expect(config.shadow).toBe(true);
    expect(config.shadowBlur).toBe(30);
    expect(config.shadowOffsetY).toBe(8);
    expect(config.aspectRatio).toEqual({ kind: 'auto' });
    expect(config.exportScale).toBe(2);
    expect(config.exportFormat).toBe('png');
    expect(config.titleColor).toBe('#a0a0a0');
    expect(config.titleFontSize).toBe(12);
  });
});

describe('RenderConfig.from — happy path', () => {
  it('should_carry_every_input_field_into_the_value_object', () => {
    const config = RenderConfig.from({
      ...validInput,
      titleColor: '#ff0000',
      titleFontSize: 16,
    });
    expect(config.theme).toBe('github-dark');
    expect(config.fontFamily).toBe('JetBrains Mono');
    expect(config.fontSize).toBe(14);
    expect(config.lineHeight).toBe(1.5);
    expect(config.borderRadius).toBe(8);
    expect(config.background).toEqual({ type: 'solid', color: '#1e1e1e' });
    expect(config.canvasBackground).toEqual({ type: 'solid', color: '#1e1e1e' });
    expect(config.showWindowControls).toBe(true);
    expect(config.windowStyle).toBe('mac');
    expect(config.showLineNumbers).toBe(false);
    expect(config.firstLineNumber).toBe(1);
    expect(config.highlightLines).toEqual([]);
    expect(config.shadow).toBe(true);
    expect(config.shadowBlur).toBe(10);
    expect(config.shadowOffsetY).toBe(4);
    expect(config.aspectRatio).toEqual({ kind: 'auto' });
    expect(config.exportScale).toBe(2);
    expect(config.exportFormat).toBe('png');
    expect(config.titleColor).toBe('#ff0000');
    expect(config.titleFontSize).toBe(16);
  });

  it('should_isolate_highlightLines_from_caller_mutation_after_construction', () => {
    const lines = [3, 7];
    const config = RenderConfig.from({ ...validInput, highlightLines: lines });
    lines.push(99);
    expect(config.highlightLines).toEqual([3, 7]);
  });

  it('should_accept_a_gradient_background_with_valid_angle', () => {
    const config = RenderConfig.from({
      ...validInput,
      background: { type: 'gradient', from: '#000', to: '#fff', angle: 45 },
    });
    expect(config.background).toEqual({ type: 'gradient', from: '#000', to: '#fff', angle: 45 });
  });

  it('should_accept_a_transparent_background', () => {
    const config = RenderConfig.from({ ...validInput, background: { type: 'transparent' } });
    expect(config.background).toEqual({ type: 'transparent' });
  });
});

describe('RenderConfig.toSnapshot / fromSnapshot', () => {
  it('should_round_trip_a_snapshot_back_to_an_equivalent_RenderConfig', () => {
    const original = RenderConfig.from(validInput);
    const round = RenderConfig.fromSnapshot(original.toSnapshot());
    expect(round.toSnapshot()).toEqual(original.toSnapshot());
  });

  it('should_expose_a_plain_data_snapshot_with_a_fresh_highlightLines_array', () => {
    const config = RenderConfig.from({ ...validInput, highlightLines: [2, 5] });
    const snapshot = config.toSnapshot();
    expect(snapshot.highlightLines).toEqual([2, 5]);
    (snapshot.highlightLines as number[]).push(99);
    expect(config.highlightLines).toEqual([2, 5]);
  });

  it('should_let_fromSnapshot_reconstruct_a_render_config_without_revalidating', () => {
    const tolerated: RenderConfigSnapshot = {
      ...validInput,
      fontSize: 4,
    };
    const config = RenderConfig.fromSnapshot(tolerated);
    expect(config.fontSize).toBe(4);
  });
});

describe('RenderConfig.from — string invariants', () => {
  it('should_reject_an_empty_theme', () => {
    expect(() => RenderConfig.from({ ...validInput, theme: '' })).toThrow(InvalidRenderConfig);
    expect(() => RenderConfig.from({ ...validInput, theme: '   ' })).toThrow(/theme/);
  });

  it('should_reject_an_empty_titleColor', () => {
    expect(() => RenderConfig.from({ ...validInput, titleColor: '' })).toThrow(/titleColor/);
    expect(() => RenderConfig.from({ ...validInput, titleColor: '   ' })).toThrow(/titleColor/);
  });

  it('should_reject_an_unknown_fontFamily', () => {
    expect(() => RenderConfig.from({ ...validInput, fontFamily: 'Comic Sans' as never })).toThrow(
      /fontFamily/,
    );
  });

  it('should_reject_an_unknown_windowStyle', () => {
    expect(() => RenderConfig.from({ ...validInput, windowStyle: 'gnome' as never })).toThrow(
      /windowStyle/,
    );
  });

  it('should_reject_an_unknown_ratio_when_aspectRatio_kind_is_fixed', () => {
    expect(() =>
      RenderConfig.from({
        ...validInput,
        aspectRatio: { kind: 'fixed', ratio: '21:9' as never },
      }),
    ).toThrow(/aspectRatio/);
  });

  it('should_reject_an_unknown_aspectRatio_kind', () => {
    expect(() =>
      RenderConfig.from({
        ...validInput,
        aspectRatio: { kind: 'square' as never },
      }),
    ).toThrow(/aspectRatio/);
  });

  it('should_reject_an_unknown_exportFormat', () => {
    expect(() => RenderConfig.from({ ...validInput, exportFormat: 'gif' as never })).toThrow(
      /exportFormat/,
    );
  });

  it('should_reject_an_unsupported_exportScale', () => {
    expect(() => RenderConfig.from({ ...validInput, exportScale: 3 as never })).toThrow(
      /exportScale/,
    );
  });
});

describe('RenderConfig.from — numeric invariants', () => {
  it.each([
    ['fontSize', 7, /fontSize must be in/],
    ['fontSize', 97, /fontSize must be in/],
    ['fontSize', Number.NaN, /fontSize/],
    ['lineHeight', 0.7, /lineHeight must be in/],
    ['lineHeight', 3.1, /lineHeight must be in/],
    ['borderRadius', -1, /borderRadius must be in/],
    ['borderRadius', 65, /borderRadius must be in/],
    ['shadowBlur', -1, /shadowBlur must be in/],
    ['shadowBlur', 101, /shadowBlur must be in/],
    ['shadowOffsetY', -51, /shadowOffsetY must be in/],
    ['shadowOffsetY', 51, /shadowOffsetY must be in/],
    ['titleFontSize', 7, /titleFontSize must be in/],
    ['titleFontSize', 19, /titleFontSize must be in/],
  ] as const)('should_reject_when_%s_is_%s', (field, value, message) => {
    expect(() => RenderConfig.from({ ...validInput, [field]: value })).toThrow(message);
  });
});

describe('RenderConfig.from — line number invariants', () => {
  it('should_reject_a_negative_firstLineNumber', () => {
    expect(() => RenderConfig.from({ ...validInput, firstLineNumber: -1 })).toThrow(
      /firstLineNumber/,
    );
  });

  it('should_reject_a_non_integer_firstLineNumber', () => {
    expect(() => RenderConfig.from({ ...validInput, firstLineNumber: 1.5 })).toThrow(
      /firstLineNumber/,
    );
  });

  it('should_reject_zero_or_negative_highlightLines', () => {
    expect(() => RenderConfig.from({ ...validInput, highlightLines: [0] })).toThrow(
      /highlightLines/,
    );
    expect(() => RenderConfig.from({ ...validInput, highlightLines: [3, -1] })).toThrow(
      /highlightLines/,
    );
  });

  it('should_reject_non_integer_highlightLines', () => {
    expect(() => RenderConfig.from({ ...validInput, highlightLines: [1.5] })).toThrow(
      /highlightLines/,
    );
  });

  it('should_reject_duplicate_highlightLines', () => {
    expect(() => RenderConfig.from({ ...validInput, highlightLines: [3, 3] })).toThrow(
      /highlightLines/,
    );
  });
});

describe('RenderConfig.from — background invariants', () => {
  it('should_reject_a_solid_background_with_an_empty_color', () => {
    expect(() =>
      RenderConfig.from({ ...validInput, background: { type: 'solid', color: '' } }),
    ).toThrow(/background\.color/);
    expect(() =>
      RenderConfig.from({ ...validInput, background: { type: 'solid', color: '   ' } }),
    ).toThrow(/background\.color/);
  });

  it('should_reject_a_gradient_background_with_an_empty_from_or_to', () => {
    expect(() =>
      RenderConfig.from({
        ...validInput,
        background: { type: 'gradient', from: '', to: '#fff', angle: 0 },
      }),
    ).toThrow(/background\.from/);
    expect(() =>
      RenderConfig.from({
        ...validInput,
        background: { type: 'gradient', from: '#000', to: '', angle: 0 },
      }),
    ).toThrow(/background\.to/);
  });

  it('should_reject_a_gradient_background_with_an_out_of_range_angle', () => {
    expect(() =>
      RenderConfig.from({
        ...validInput,
        background: { type: 'gradient', from: '#000', to: '#fff', angle: -1 },
      }),
    ).toThrow(/background\.angle/);
    expect(() =>
      RenderConfig.from({
        ...validInput,
        background: { type: 'gradient', from: '#000', to: '#fff', angle: 361 },
      }),
    ).toThrow(/background\.angle/);
  });
});

describe('RenderConfig.withAspectRatio', () => {
  it('should_return_a_new_RenderConfig_with_the_given_aspectRatio_when_withAspectRatio_is_called', () => {
    const original = RenderConfig.from(validInput);
    const updated = original.withAspectRatio({ kind: 'fixed', ratio: '1:1' });
    expect(updated.aspectRatio).toEqual({ kind: 'fixed', ratio: '1:1' });
    expect(updated.toSnapshot()).toEqual({
      ...original.toSnapshot(),
      aspectRatio: { kind: 'fixed', ratio: '1:1' },
    });
    expect(original.aspectRatio).toEqual({ kind: 'auto' });
  });
});
