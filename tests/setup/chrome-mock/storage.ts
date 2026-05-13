import type { ChromeMock, StorageValue } from './types';

type StorageMock = NonNullable<ChromeMock['storage']>;
type StorageArea = 'sync' | 'local' | 'session';
type StorageOp = 'get' | 'set' | 'remove';

interface QueuedFault {
  readonly area: StorageArea;
  readonly op: StorageOp;
  readonly cause: Error;
}

interface StorageChange {
  readonly oldValue?: StorageValue;
  readonly newValue?: StorageValue;
}

type ChangedListener = (changes: Record<string, StorageChange>, areaName: StorageArea) => void;

const syncStore = new Map<string, StorageValue>();
const localStore = new Map<string, StorageValue>();
const sessionStore = new Map<string, StorageValue>();
const faultQueue: QueuedFault[] = [];
const changedListeners = new Set<ChangedListener>();

function consumeFault(area: StorageArea, op: StorageOp): QueuedFault | undefined {
  const idx = faultQueue.findIndex((f) => f.area === area && f.op === op);
  if (idx === -1) return undefined;
  return faultQueue.splice(idx, 1)[0];
}

function emit(area: StorageArea, changes: Record<string, StorageChange>): void {
  if (Object.keys(changes).length === 0) return;
  for (const listener of changedListeners) listener(changes, area);
}

type GetKeys = string | string[] | Record<string, unknown> | null | undefined;

function buildArea(area: StorageArea, store: Map<string, StorageValue>) {
  return {
    get: (keys?: GetKeys) => {
      const fault = consumeFault(area, 'get');
      if (fault !== undefined) return Promise.reject(fault.cause);
      const out: Record<string, StorageValue> = {};
      const requested = normaliseKeys(keys, store);
      for (const k of requested) {
        const v = store.get(k);
        if (v !== undefined) out[k] = v;
      }
      return Promise.resolve(out);
    },
    set: (items: Record<string, StorageValue>) => {
      const fault = consumeFault(area, 'set');
      if (fault !== undefined) return Promise.reject(fault.cause);
      const changes: Record<string, StorageChange> = {};
      for (const [k, v] of Object.entries(items)) {
        const oldValue = store.get(k);
        store.set(k, v);
        changes[k] = oldValue === undefined ? { newValue: v } : { oldValue, newValue: v };
      }
      emit(area, changes);
      return Promise.resolve();
    },
    remove: (keys: string | string[]) => {
      const fault = consumeFault(area, 'remove');
      if (fault !== undefined) return Promise.reject(fault.cause);
      const list = Array.isArray(keys) ? keys : [keys];
      const changes: Record<string, StorageChange> = {};
      for (const k of list) {
        const oldValue = store.get(k);
        if (oldValue === undefined) continue;
        store.delete(k);
        changes[k] = { oldValue };
      }
      emit(area, changes);
      return Promise.resolve();
    },
  };
}

function normaliseKeys(keys: GetKeys, store: Map<string, StorageValue>): string[] {
  if (keys === undefined || keys === null) return Array.from(store.keys());
  if (typeof keys === 'string') return [keys];
  if (Array.isArray(keys)) return keys;
  return Object.keys(keys);
}

export function buildStorageMock(): StorageMock {
  return {
    sync: buildArea('sync', syncStore),
    local: buildArea('local', localStore),
    session: buildArea('session', sessionStore),
    onChanged: {
      addListener: (cb: ChangedListener) => {
        changedListeners.add(cb);
      },
      removeListener: (cb: ChangedListener) => {
        changedListeners.delete(cb);
      },
    },
  };
}

export function resetStorage(): void {
  syncStore.clear();
  localStore.clear();
  sessionStore.clear();
  faultQueue.length = 0;
  changedListeners.clear();
}

export function queueStorageFault(fault: QueuedFault): void {
  faultQueue.push(fault);
}

export function readSession(key: string): StorageValue | undefined {
  return sessionStore.get(key);
}
