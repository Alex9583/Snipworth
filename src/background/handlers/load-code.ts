import type { LoadCodeRequest, ResponseFor } from '@/lib/messaging';

export function handleLoadCode(_message: LoadCodeRequest): ResponseFor<LoadCodeRequest> {
  return { ok: false, error: 'not implemented: LOAD_CODE' };
}
