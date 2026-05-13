import type { ChromeMock } from './types';

type Tab = chrome.tabs.Tab;
type TabsMock = NonNullable<ChromeMock['tabs']>;

export interface TabsCreateProperties {
  readonly url?: string;
}

export type TabsOp = 'create';

export interface QueuedTabsFault {
  readonly op: TabsOp;
  readonly cause: Error;
}

const recordedCreates: TabsCreateProperties[] = [];
let pendingCreateFault: QueuedTabsFault | undefined;

export function buildTabsMock(): TabsMock {
  return {
    create: (properties: TabsCreateProperties): Promise<Tab> => {
      recordedCreates.push(properties);
      if (pendingCreateFault !== undefined) {
        const fault = pendingCreateFault;
        pendingCreateFault = undefined;
        return Promise.reject(fault.cause);
      }
      return Promise.resolve({}) as Promise<Tab>;
    },
  };
}

export function resetTabs(): void {
  recordedCreates.length = 0;
  pendingCreateFault = undefined;
}

export function readCreatedTabs(): readonly TabsCreateProperties[] {
  return [...recordedCreates];
}

export function queueTabsCreateFault(fault: QueuedTabsFault): void {
  pendingCreateFault = fault;
}
