// vitest.setup.ts
import { vi } from 'vitest';

// Mock browser APIs that might not be fully implemented in JSDOM
if (typeof window !== 'undefined') {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }));

  // Mock requestAnimationFrame
  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = vi.fn().mockImplementation(callback => {
      return setTimeout(() => callback(Date.now()), 0);
    });
  }

  // Mock cancelAnimationFrame
  if (!window.cancelAnimationFrame) {
    window.cancelAnimationFrame = vi.fn().mockImplementation(id => {
      clearTimeout(id);
    });
  }

  // Mock performance.now
  if (!window.performance) {
    window.performance = {
      now: vi.fn(() => Date.now()),
    } as any;
  }

  // Mock Blob URL creation
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn(() => 'mock-object-url');
  }

  // Mock Blob URL revocation
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
}

// Silence console warnings during tests
console.warn = vi.fn();