import type { IntersectionObserverFactory } from '@/adapters/primary/library/IntersectionObserverFactory';

interface Subscription {
  readonly callback: IntersectionObserverCallback;
  readonly observer: IntersectionObserver;
}

const noop = (): void => undefined;

export class FakeIntersectionObserverFactory {
  private readonly subscriptions: Subscription[] = [];

  readonly factory: IntersectionObserverFactory = (callback) => {
    const observer: IntersectionObserver = {
      root: null,
      rootMargin: '',
      scrollMargin: '',
      thresholds: [],
      observe: noop,
      unobserve: noop,
      disconnect: noop,
      takeRecords: () => [],
    };
    this.subscriptions.push({ callback, observer });
    return observer;
  };

  triggerIntersection(isIntersecting: boolean): void {
    for (const { callback, observer } of this.subscriptions) {
      const entry = { isIntersecting } as unknown as IntersectionObserverEntry;
      callback([entry], observer);
    }
  }
}
