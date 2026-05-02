import type { ChromeMock } from './types';

type SidePanelMock = NonNullable<ChromeMock['sidePanel']>;
type PanelBehavior = chrome.sidePanel.PanelBehavior;

const state: { behavior: PanelBehavior | undefined } = { behavior: undefined };

export function buildSidePanelMock(): SidePanelMock {
  return {
    setPanelBehavior: (behavior: PanelBehavior) => {
      state.behavior = behavior;
      return Promise.resolve();
    },
    open: () => Promise.resolve(),
  };
}

export function resetSidePanel(): void {
  state.behavior = undefined;
}

export function readBehavior(): PanelBehavior | undefined {
  return state.behavior;
}
