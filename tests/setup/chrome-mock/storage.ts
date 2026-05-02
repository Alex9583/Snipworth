import type { ChromeMock, StorageValue } from './types';

type StorageMock = NonNullable<ChromeMock['storage']>;

const store = new Map<string, StorageValue>();

export function buildStorageMock(): StorageMock {
  return {
    sync: {
      get: (keys: string[]) => {
        const out: Record<string, StorageValue> = {};
        for (const k of keys) {
          const v = store.get(k);
          if (v !== undefined) out[k] = v;
        }
        return Promise.resolve(out);
      },
      set: (items: Record<string, StorageValue>) => {
        for (const [k, v] of Object.entries(items)) store.set(k, v);
        return Promise.resolve();
      },
    },
    onChanged: {
      addListener: () => undefined,
      removeListener: () => undefined,
    },
  };
}

export function resetStorage(): void {
  store.clear();
}
