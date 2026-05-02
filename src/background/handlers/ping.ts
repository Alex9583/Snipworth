import type { PingRequest, ResponseFor } from '@/lib/messaging';

export function handlePing(_message: PingRequest): ResponseFor<PingRequest> {
  return { ok: true, data: 'pong' };
}
