import type { ChromeMock } from './types';

type ScriptingMock = NonNullable<ChromeMock['scripting']>;
type ExecuteScript = NonNullable<ScriptingMock['executeScript']>;

const state: { readonly pendingResults: string[]; readonly faults: Error[] } = {
  pendingResults: [],
  faults: [],
};

export function queueExecuteScriptResult(value: string): void {
  state.pendingResults.push(value);
}

export function queueExecuteScriptFault(cause: Error): void {
  state.faults.push(cause);
}

export function resetScripting(): void {
  state.pendingResults.length = 0;
  state.faults.length = 0;
}

export function buildScriptingMock(): ScriptingMock {
  const executeScript = (() => {
    const fault = state.faults.shift();
    if (fault !== undefined) return Promise.reject(fault);
    const value = state.pendingResults.shift() ?? '';
    return Promise.resolve([{ frameId: 0, result: value }]);
  }) as unknown as ExecuteScript;
  return { executeScript };
}
