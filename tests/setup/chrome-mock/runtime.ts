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
type StartupListener = () => void;

export const SELF_EXTENSION_ID = 'snipworth-test-extension';

type RuntimeOp = 'sendMessage';

interface QueuedFault {
  readonly op: RuntimeOp;
  readonly cause: Error;
}

const messageListeners = new Set<MessageListener>();
const installedListeners = new Set<InstalledListener>();
const startupListeners = new Set<StartupListener>();
const faultQueue: QueuedFault[] = [];

let pendingLastError: { message?: string } | undefined;

async function fanOutToListeners(
  message: unknown,
  sender: MessageSender,
): Promise<DispatchedMessage> {
  let resolveResponse: (r: unknown) => void = () => undefined;
  const responsePromise = new Promise<unknown>((resolve) => {
    resolveResponse = resolve;
  });
  let resolved = false;
  let asyncExpected = false;
  const sendResponse = (r: unknown): void => {
    if (resolved) return;
    resolved = true;
    resolveResponse(r);
  };
  for (const listener of messageListeners) {
    const ret = listener(message, sender, sendResponse);
    if (ret === true) asyncExpected = true;
  }
  if (!asyncExpected) {
    sendResponse(undefined);
  }
  return { response: await responsePromise, asyncExpected };
}

export function buildRuntimeMock(): RuntimeMock {
  return {
    id: SELF_EXTENSION_ID,
    get lastError() {
      return pendingLastError;
    },
    getURL: (p: string) => `chrome-extension://test/${p}`,
    sendMessage: async (message: unknown) => {
      const fault = faultQueue.shift();
      if (fault !== undefined) throw fault.cause;
      return (await fanOutToListeners(message, { id: SELF_EXTENSION_ID })).response;
    },
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
    onStartup: {
      addListener: (cb: StartupListener) => {
        startupListeners.add(cb);
      },
    },
  };
}

export function setRuntimeLastError(message: string): void {
  pendingLastError = { message };
}

export function clearRuntimeLastError(): void {
  pendingLastError = undefined;
}

export function withRuntimeLastError<T>(message: string, fn: () => T): T {
  setRuntimeLastError(message);
  try {
    return fn();
  } finally {
    clearRuntimeLastError();
  }
}

export function resetRuntime(): void {
  messageListeners.clear();
  installedListeners.clear();
  startupListeners.clear();
  faultQueue.length = 0;
  pendingLastError = undefined;
}

export function queueRuntimeFault(fault: QueuedFault): void {
  faultQueue.push(fault);
}

export interface DispatchedMessage {
  readonly response: unknown;
  readonly asyncExpected: boolean;
}

export function dispatchMessage(
  message: unknown,
  sender: MessageSender = { id: SELF_EXTENSION_ID },
): Promise<DispatchedMessage> {
  return fanOutToListeners(message, sender);
}

export function dispatchInstalled(details: InstalledDetails = { reason: 'install' }): void {
  for (const listener of installedListeners) listener(details);
}

export function dispatchStartup(): void {
  for (const listener of startupListeners) listener();
}
