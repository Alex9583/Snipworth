import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });

  it('has happy-dom', () => {
    expect(document.createElement('div')).toBeDefined();
  });

  it('has chrome mock', () => {
    expect(globalThis.chrome.runtime.getURL('x')).toBe('chrome-extension://test/x');
  });

  it('has fake-indexeddb', () => {
    expect(typeof indexedDB.open).toBe('function');
  });
});
