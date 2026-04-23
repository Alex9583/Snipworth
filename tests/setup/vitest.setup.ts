import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { installChromeMock, resetChromeMock } from './chrome-mock';

installChromeMock();

beforeEach(() => {
  resetChromeMock();
});

afterEach(() => {
  cleanup();
});
