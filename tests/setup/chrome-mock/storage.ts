import type { ChromeMock, StorageValue } from './types';

type StorageMock = NonNullable<ChromeMock['storage']>;
type StorageArea = 'sync' | 'local';
type StorageOp = 'get' | 'set';

interface QueuedFault {
  readonly area: StorageArea;
  readonly op: StorageOp;
  readonly cause: Error;
}

const syncStore = new Map<string, StorageValue>();
const localStore = new Map<string, StorageValue>();
const faultQueue: QueuedFault[] = [];

function consumeFault(area: StorageArea, op: StorageOp): QueuedFault | undefined {
  const idx = faultQueue.findIndex((f) => f.area === area && f.op === op);
  if (idx === -1) return undefined;
  return faultQueue.splice(idx, 1)[0];
}

function buildArea(area: StorageArea, store: Map<string, StorageValue>) {
  return {
    get: (keys: string[]) => {
      const fault = consumeFault(area, 'get');
      if (fault !== undefined) return Promise.reject(fault.cause);
      const out: Record<string, StorageValue> = {};
      for (const k of keys) {
        const v = store.get(k);
        if (v !== undefined) out[k] = v;
      }
      return Promise.resolve(out);
    },
    set: (items: Record<string, StorageValue>) => {
      const fault = consumeFault(area, 'set');
      if (fault !== undefined) return Promise.reject(fault.cause);
      for (const [k, v] of Object.entries(items)) store.set(k, v);
      return Promise.resolve();
    },
  };
}

export function buildStorageMock(): StorageMock {
  return {
    sync: buildArea('sync', syncStore),
    local: buildArea('local', localStore),
    onChanged: {
      addListener: () => undefined,
      removeListener: () => undefined,
    },
  };
}

export function resetStorage(): void {
  syncStore.clear();
  localStore.clear();
  faultQueue.length = 0;
}

export function queueStorageFault(fault: QueuedFault): void {
  faultQueue.push(fault);
}
