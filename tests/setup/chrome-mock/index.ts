import { buildActionMock, resetAction } from './action';
import { buildContextMenusMock } from './context-menus';
import { buildRuntimeMock, resetRuntime } from './runtime';
import { buildSidePanelMock, resetSidePanel } from './side-panel';
import { buildStorageMock, resetStorage } from './storage';
import { buildTabsMock } from './tabs';
import type { ChromeMock } from './types';

export type { StorageValue } from './types';
export {
  dispatchInstalled,
  dispatchMessage,
  dispatchStartup,
  queueRuntimeFault,
  SELF_EXTENSION_ID,
} from './runtime';
export { readBadge, queueActionFault } from './action';
export { readBehavior, queueSidePanelFault } from './side-panel';
export { queueStorageFault } from './storage';

function buildChromeMock(): ChromeMock {
  return {
    runtime: buildRuntimeMock(),
    storage: buildStorageMock(),
    sidePanel: buildSidePanelMock(),
    contextMenus: buildContextMenusMock(),
    tabs: buildTabsMock(),
    action: buildActionMock(),
  };
}

export function resetChromeMock(): void {
  resetRuntime();
  resetStorage();
  resetAction();
  resetSidePanel();
  globalThis.chrome = buildChromeMock() as typeof chrome;
}

export function installChromeMock(): void {
  resetChromeMock();
}
