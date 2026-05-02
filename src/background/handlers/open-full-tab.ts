import type { OpenFullTabRequest, ResponseFor } from '@/lib/messaging';

export function handleOpenFullTab(_message: OpenFullTabRequest): ResponseFor<OpenFullTabRequest> {
  return { ok: false, error: 'not implemented: OPEN_FULL_TAB' };
}
