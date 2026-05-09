import type { ChromeMock } from './types';

type SidePanelMock = NonNullable<ChromeMock['sidePanel']>;
type PanelBehavior = chrome.sidePanel.PanelBehavior;
type OpenOptions = chrome.sidePanel.OpenOptions;
type SidePanelOp = 'setPanelBehavior' | 'open';

interface QueuedFault {
  readonly op: SidePanelOp;
  readonly cause: Error;
}

const state: { behavior: PanelBehavior | undefined } = { behavior: undefined };
const recordedOpens: OpenOptions[] = [];
const faultQueue: QueuedFault[] = [];

function consumeFault(op: SidePanelOp): QueuedFault | undefined {
  const idx = faultQueue.findIndex((f) => f.op === op);
  if (idx === -1) return undefined;
  return faultQueue.splice(idx, 1)[0];
}

export function buildSidePanelMock(): SidePanelMock {
  return {
    setPanelBehavior: (behavior: PanelBehavior) => {
      const fault = consumeFault('setPanelBehavior');
      if (fault !== undefined) return Promise.reject(fault.cause);
      state.behavior = behavior;
      return Promise.resolve();
    },
    open: (options: OpenOptions) => {
      recordedOpens.push(options);
      const fault = consumeFault('open');
      if (fault !== undefined) return Promise.reject(fault.cause);
      return Promise.resolve();
    },
  };
}

export function resetSidePanel(): void {
  state.behavior = undefined;
  recordedOpens.length = 0;
  faultQueue.length = 0;
}

export function readBehavior(): PanelBehavior | undefined {
  return state.behavior;
}

export function readSidePanelOpens(): readonly OpenOptions[] {
  return recordedOpens.slice();
}

export function queueSidePanelFault(fault: QueuedFault): void {
  faultQueue.push(fault);
}
