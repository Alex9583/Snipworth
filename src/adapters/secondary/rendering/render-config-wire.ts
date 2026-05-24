import { z } from 'zod';

import { THEME_MAX } from '@/domain/limits';
import {
  ANGLE_RANGE,
  exportFormats,
  fixedAspectRatios,
  FONT_SIZE_RANGE,
  fontFamilies,
  LINE_HEIGHT_RANGE,
  RADIUS_RANGE,
  RenderConfig,
  SHADOW_BLUR_RANGE,
  SHADOW_OFFSET_RANGE,
  windowStyles,
  type RenderConfigSnapshot,
} from '@/domain/rendering/RenderConfig';

const bounded = (range: readonly [number, number]): z.ZodType<number> =>
  z.number().min(range[0]).max(range[1]);

const backgroundWireSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('solid'), color: z.string() }),
  z.strictObject({
    type: z.literal('gradient'),
    from: z.string(),
    to: z.string(),
    angle: bounded(ANGLE_RANGE),
  }),
  z.strictObject({ type: z.literal('transparent') }),
]);

const aspectRatioWireSchema = z.discriminatedUnion('kind', [
  z.strictObject({ kind: z.literal('fixed'), ratio: z.enum(fixedAspectRatios) }),
  z.strictObject({ kind: z.literal('auto') }),
]);

const renderConfigBaseShape = {
  theme: z.string().min(1).max(THEME_MAX),
  fontFamily: z.enum(fontFamilies),
  fontSize: bounded(FONT_SIZE_RANGE),
  lineHeight: bounded(LINE_HEIGHT_RANGE),
  borderRadius: bounded(RADIUS_RANGE),
  background: backgroundWireSchema,
  showWindowControls: z.boolean(),
  windowStyle: z.enum(windowStyles),
  showLineNumbers: z.boolean(),
  firstLineNumber: z.number().int().min(0),
  highlightLines: z.array(z.number().int().min(1)),
  shadow: z.boolean(),
  shadowBlur: bounded(SHADOW_BLUR_RANGE),
  shadowOffsetY: bounded(SHADOW_OFFSET_RANGE),
  exportScale: z.union([z.literal(1), z.literal(2), z.literal(4)]),
  exportFormat: z.enum(exportFormats),
};

export const renderConfigStrictWireSchema: z.ZodType<RenderConfigSnapshot> = z.object({
  ...renderConfigBaseShape,
  aspectRatio: aspectRatioWireSchema,
});

export const renderConfigWireSchema = z.object({
  ...renderConfigBaseShape,
  aspectRatio: aspectRatioWireSchema.optional(),
});

export type RenderConfigWire = z.infer<typeof renderConfigWireSchema>;

export function fillRenderConfigDefaults(stored: RenderConfigWire): RenderConfigSnapshot {
  const defaults = RenderConfig.default().toSnapshot();
  return {
    ...stored,
    aspectRatio: stored.aspectRatio ?? defaults.aspectRatio,
  };
}
