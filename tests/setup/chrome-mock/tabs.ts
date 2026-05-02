import type { ChromeMock } from './types';

type Tab = chrome.tabs.Tab;
type TabsMock = NonNullable<ChromeMock['tabs']>;

export function buildTabsMock(): TabsMock {
  return {
    create: () => Promise.resolve({}) as Promise<Tab>,
  };
}
