import { buildContextMenusMock } from './context-menus';
import { buildRuntimeMock, resetRuntime } from './runtime';
import { buildSidePanelMock } from './side-panel';
import { buildStorageMock, resetStorage } from './storage';
import { buildTabsMock } from './tabs';
import type { ChromeMock } from './types';

export type { StorageValue } from './types';
export { dispatchInstalled, dispatchMessage } from './runtime';

function buildChromeMock(): ChromeMock {
  return {
    runtime: buildRuntimeMock(),
    storage: buildStorageMock(),
    sidePanel: buildSidePanelMock(),
    contextMenus: buildContextMenusMock(),
    tabs: buildTabsMock(),
  };
}

export function resetChromeMock(): void {
  resetRuntime();
  resetStorage();
  globalThis.chrome = buildChromeMock() as typeof chrome;
}

export function installChromeMock(): void {
  resetChromeMock();
}
