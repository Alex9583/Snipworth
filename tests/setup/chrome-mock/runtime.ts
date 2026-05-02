import type { ChromeMock } from './types';

type MessageSender = chrome.runtime.MessageSender;
type OnInstalledReason = chrome.runtime.OnInstalledReason;
type RuntimeMock = NonNullable<ChromeMock['runtime']>;

interface InstalledDetails {
  reason: OnInstalledReason;
  previousVersion?: string;
  id?: string;
}

type MessageListener = (
  message: unknown,
  sender: MessageSender,
  sendResponse: (response: unknown) => void,
) => boolean | undefined;

type InstalledListener = (details: InstalledDetails) => void;

const messageListeners = new Set<MessageListener>();
const installedListeners = new Set<InstalledListener>();

export function buildRuntimeMock(): RuntimeMock {
  return {
    getURL: (p: string) => `chrome-extension://test/${p}`,
    sendMessage: () => Promise.resolve(undefined),
    onMessage: {
      addListener: (cb: MessageListener) => {
        messageListeners.add(cb);
      },
      removeListener: (cb: MessageListener) => {
        messageListeners.delete(cb);
      },
    },
    onInstalled: {
      addListener: (cb: InstalledListener) => {
        installedListeners.add(cb);
      },
    },
  };
}

export function resetRuntime(): void {
  messageListeners.clear();
  installedListeners.clear();
}

export function dispatchMessage(
  message: unknown,
  sender: MessageSender = {},
): { response: unknown; asyncExpected: boolean } {
  let response: unknown;
  let responded = false;
  let asyncExpected = false;
  const sendResponse = (r: unknown): void => {
    if (responded) return;
    responded = true;
    response = r;
  };
  for (const listener of messageListeners) {
    const ret = listener(message, sender, sendResponse);
    if (ret === true) asyncExpected = true;
  }
  return { response, asyncExpected };
}

export function dispatchInstalled(details: InstalledDetails = { reason: 'install' }): void {
  for (const listener of installedListeners) listener(details);
}
