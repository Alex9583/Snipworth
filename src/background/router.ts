import { extensionMessageSchema, type ExtensionResponse } from '@/lib/messaging';
import { handleLoadCode } from './handlers/load-code';
import { handleOpenFullTab } from './handlers/open-full-tab';
import { handlePing } from './handlers/ping';

export function routeMessage(rawMessage: unknown): ExtensionResponse {
  const parsed = extensionMessageSchema.safeParse(rawMessage);
  if (!parsed.success) {
    console.warn('[snipworth] ignored malformed message', parsed.error.issues);
    return { ok: false, error: 'malformed message' };
  }
  const message = parsed.data;
  switch (message.type) {
    case 'PING':
      return handlePing(message);
    case 'OPEN_FULL_TAB':
      return handleOpenFullTab(message);
    case 'LOAD_CODE':
      return handleLoadCode(message);
  }
}
