import { buildActionMock, resetAction } from './action';
import { buildContextMenusMock, resetContextMenus } from './context-menus';
import { buildRuntimeMock, resetRuntime } from './runtime';
import { buildScriptingMock, resetScripting } from './scripting';
import { buildSidePanelMock, resetSidePanel } from './side-panel';
import { buildStorageMock, resetStorage } from './storage';
import { buildTabsMock } from './tabs';
import type { ChromeMock } from './types';

export type { StorageValue } from './types';
export {
  clearRuntimeLastError,
  dispatchInstalled,
  dispatchMessage,
  dispatchStartup,
  queueRuntimeFault,
  SELF_EXTENSION_ID,
  setRuntimeLastError,
  withRuntimeLastError,
} from './runtime';
export { readBadge, queueActionFault } from './action';
export { readBehavior, readSidePanelOpens, queueSidePanelFault } from './side-panel';
export { queueStorageFault, readSession } from './storage';
export { dispatchContextMenuClick, readCreatedMenus } from './context-menus';
export { queueExecuteScriptFault, queueExecuteScriptResult } from './scripting';

function buildChromeMock(): ChromeMock {
  return {
    runtime: buildRuntimeMock(),
    storage: buildStorageMock(),
    sidePanel: buildSidePanelMock(),
    contextMenus: buildContextMenusMock(),
    tabs: buildTabsMock(),
    action: buildActionMock(),
    scripting: buildScriptingMock(),
  };
}

export function resetChromeMock(): void {
  resetRuntime();
  resetStorage();
  resetAction();
  resetSidePanel();
  resetContextMenus();
  resetScripting();
  globalThis.chrome = buildChromeMock() as typeof chrome;
}

export function installChromeMock(): void {
  resetChromeMock();
}
