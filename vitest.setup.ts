import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

configure({ asyncUtilTimeout: 10_000 });

if (typeof globalThis.IntersectionObserver === 'undefined') {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;
}

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});
