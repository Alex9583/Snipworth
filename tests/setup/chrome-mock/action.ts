import type { ChromeMock } from './types';

type ActionMock = NonNullable<ChromeMock['action']>;
type ActionOp = 'setBadgeText' | 'setBadgeBackgroundColor';

interface QueuedFault {
  readonly op: ActionOp;
  readonly cause: Error;
}

const state: { badgeText: string; badgeColor: string | null } = {
  badgeText: '',
  badgeColor: null,
};

const faultQueue: QueuedFault[] = [];

function consumeFault(op: ActionOp): QueuedFault | undefined {
  const idx = faultQueue.findIndex((f) => f.op === op);
  if (idx === -1) return undefined;
  return faultQueue.splice(idx, 1)[0];
}

export function buildActionMock(): ActionMock {
  return {
    setBadgeText: (details: { text?: string | null }) => {
      const fault = consumeFault('setBadgeText');
      if (fault) return Promise.reject(fault.cause);
      state.badgeText = details.text ?? '';
      return Promise.resolve();
    },
    setBadgeBackgroundColor: (details: { color: string | [number, number, number, number] }) => {
      const fault = consumeFault('setBadgeBackgroundColor');
      if (fault) return Promise.reject(fault.cause);
      state.badgeColor =
        typeof details.color === 'string' ? details.color : details.color.join(',');
      return Promise.resolve();
    },
  };
}

export function resetAction(): void {
  state.badgeText = '';
  state.badgeColor = null;
  faultQueue.length = 0;
}

export function readBadge(): { text: string; color: string | null } {
  return { text: state.badgeText, color: state.badgeColor };
}

export function queueActionFault(fault: QueuedFault): void {
  faultQueue.push(fault);
}
