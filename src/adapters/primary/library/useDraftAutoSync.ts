import { useEffect, useEffectEvent } from 'react';

import type { Platform } from '@/domain/drafts/Platform';
import { RenderConfig, type RenderConfigSnapshot } from '@/domain/rendering/RenderConfig';

import type { UseDraftBindingResult } from './useDraftBinding';

export interface DraftAutoSyncFields {
  readonly code: string;
  readonly language: string;
  readonly title: string;
  readonly renderConfig: RenderConfigSnapshot;
  readonly platform?: Platform;
  readonly caption?: string;
  readonly hashtags?: readonly string[];
}

export function useDraftAutoSync(
  draftBinding: UseDraftBindingResult,
  fields: DraftAutoSyncFields,
): void {
  const push = useEffectEvent((patch: Parameters<typeof draftBinding.mutate>[0]) => {
    if (draftBinding.binding.kind !== 'bound') return;
    draftBinding.mutate(patch);
  });

  useEffect(() => {
    push({ code: fields.code, language: fields.language });
  }, [fields.code, fields.language]);

  useEffect(() => {
    push({ title: fields.title });
  }, [fields.title]);

  useEffect(() => {
    if (fields.platform !== undefined) push({ platform: fields.platform });
  }, [fields.platform]);

  useEffect(() => {
    if (fields.caption !== undefined) push({ caption: fields.caption });
  }, [fields.caption]);

  useEffect(() => {
    if (fields.hashtags !== undefined) push({ hashtags: fields.hashtags });
  }, [fields.hashtags]);

  useEffect(() => {
    push({ config: RenderConfig.fromSnapshot(fields.renderConfig) });
  }, [fields.renderConfig]);
}
