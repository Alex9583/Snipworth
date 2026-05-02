import type { ChromeMock } from './types';

type ContextMenusMock = NonNullable<ChromeMock['contextMenus']>;

export function buildContextMenusMock(): ContextMenusMock {
  return {
    create: () => 0,
    onClicked: { addListener: () => undefined },
  };
}
