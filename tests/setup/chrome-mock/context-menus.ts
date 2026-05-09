import type { ChromeMock } from './types';

type ContextMenusMock = NonNullable<ChromeMock['contextMenus']>;
type CreateProperties = chrome.contextMenus.CreateProperties;
type OnClickData = chrome.contextMenus.OnClickData;
type Tab = chrome.tabs.Tab;
type ClickListener = (info: OnClickData, tab?: Tab) => void;

interface CreatedMenu {
  readonly id: number | string;
  readonly properties: CreateProperties;
}

const created: CreatedMenu[] = [];
const clickListeners = new Set<ClickListener>();

let nextAutoId = 1;

export function buildContextMenusMock(): ContextMenusMock {
  return {
    create: (properties: CreateProperties, callback?: () => void) => {
      const id: number | string = properties.id ?? nextAutoId++;
      created.push({ id, properties });
      callback?.();
      return id;
    },
    onClicked: {
      addListener: (cb: ClickListener) => {
        clickListeners.add(cb);
      },
      removeListener: (cb: ClickListener) => {
        clickListeners.delete(cb);
      },
    },
  };
}

export function resetContextMenus(): void {
  created.length = 0;
  clickListeners.clear();
  nextAutoId = 1;
}

export function readCreatedMenus(): readonly CreatedMenu[] {
  return [...created];
}

export function dispatchContextMenuClick(info: OnClickData, tab?: Tab): void {
  for (const listener of clickListeners) listener(info, tab);
}
