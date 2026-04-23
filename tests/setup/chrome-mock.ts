type StorageListener = (
  changes: Record<string, { oldValue?: StorageValue; newValue?: StorageValue }>,
  areaName: string,
) => void;

type MessageListener = (message: unknown) => void;
type InstalledListener = () => void;
type ContextMenuListener = (info: unknown) => void;

export type StorageValue =
  | string
  | number
  | boolean
  | null
  | StorageValue[]
  | { [key: string]: StorageValue };

export interface ChromeMockShape {
  runtime: {
    getURL(path: string): string;
    sendMessage(message: unknown): Promise<unknown>;
    onMessage: {
      addListener(callback: MessageListener): void;
      removeListener(callback: MessageListener): void;
    };
    onInstalled: { addListener(callback: InstalledListener): void };
  };
  storage: {
    sync: {
      get(keys: string[]): Promise<Record<string, StorageValue>>;
      set(items: Record<string, StorageValue>): Promise<void>;
    };
    onChanged: {
      addListener(callback: StorageListener): void;
      removeListener(callback: StorageListener): void;
    };
  };
  sidePanel: {
    setPanelBehavior(options: { openPanelOnActionClick: boolean }): Promise<void>;
    open(options: { tabId?: number; windowId?: number }): Promise<void>;
  };
  contextMenus: {
    create(options: Record<string, unknown>): void;
    onClicked: { addListener(callback: ContextMenuListener): void };
  };
  tabs: {
    create(options: { url: string }): Promise<{ id?: number }>;
  };
}

declare global {
  var chrome: ChromeMockShape;
}

const store = new Map<string, StorageValue>();

function buildChromeMock(): ChromeMockShape {
  return {
    runtime: {
      getURL: (p) => `chrome-extension://test/${p}`,
      sendMessage: () => Promise.resolve(undefined),
      onMessage: { addListener: () => undefined, removeListener: () => undefined },
      onInstalled: { addListener: () => undefined },
    },
    storage: {
      sync: {
        get: (keys) => {
          const out: Record<string, StorageValue> = {};
          for (const k of keys) {
            const v = store.get(k);
            if (v !== undefined) out[k] = v;
          }
          return Promise.resolve(out);
        },
        set: (items) => {
          for (const [k, v] of Object.entries(items)) store.set(k, v);
          return Promise.resolve();
        },
      },
      onChanged: {
        addListener: () => undefined,
        removeListener: () => undefined,
      },
    },
    sidePanel: {
      setPanelBehavior: () => Promise.resolve(),
      open: () => Promise.resolve(),
    },
    contextMenus: {
      create: () => undefined,
      onClicked: { addListener: () => undefined },
    },
    tabs: {
      create: () => Promise.resolve({}),
    },
  };
}

export function resetChromeMock(): void {
  store.clear();
  globalThis.chrome = buildChromeMock();
}

export function installChromeMock(): void {
  resetChromeMock();
}
