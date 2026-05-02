import type { ChromeMock } from './types';

type SidePanelMock = NonNullable<ChromeMock['sidePanel']>;

export function buildSidePanelMock(): SidePanelMock {
  return {
    setPanelBehavior: () => Promise.resolve(),
    open: () => Promise.resolve(),
  };
}
