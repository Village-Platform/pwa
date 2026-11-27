import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Newer Node versions expose an experimental `localStorage` global that shadows jsdom's and throws
// or is undefined without --localstorage-file. Use a plain in-memory Storage so tests behave the
// same on every Node version.
class MemoryStorage implements Storage {
  #map = new Map<string, string>();
  get length() {
    return this.#map.size;
  }
  key(i: number) {
    return [...this.#map.keys()][i] ?? null;
  }
  getItem(k: string) {
    return this.#map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.#map.set(String(k), String(v));
  }
  removeItem(k: string) {
    this.#map.delete(k);
  }
  clear() {
    this.#map.clear();
  }
}
for (const name of ["localStorage", "sessionStorage"]) {
  const storage = new MemoryStorage();
  Object.defineProperty(globalThis, name, { value: storage, configurable: true, writable: true });
  Object.defineProperty(window, name, { value: storage, configurable: true, writable: true });
}

// jsdom has no matchMedia (lib/theme.ts reads it at import time).
window.matchMedia ??= (query: string) =>
  ({
    matches: false,
    media: query,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  }) as MediaQueryList;

afterEach(() => {
  cleanup();
  localStorage.clear();
});
