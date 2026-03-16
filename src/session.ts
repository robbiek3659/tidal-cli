import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const SESSION_DIR = path.join(os.homedir(), '.tidal-cli');
const SESSION_FILE = path.join(SESSION_DIR, 'session.json');

function ensureDir(): void {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { mode: 0o700 });
  }
}

export function loadStorage(): Record<string, string> {
  ensureDir();
  if (!fs.existsSync(SESSION_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

export function saveStorage(data: Record<string, string>): void {
  ensureDir();
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2), { mode: 0o600 });
}

/**
 * Install a globalThis.localStorage polyfill backed by ~/.tidal-cli/session.json.
 * Must be called before importing @tidal-music/auth.
 */
export function installLocalStorage(): void {
  // Always install our file-backed polyfill — Node.js 22+ has a built-in
  // localStorage that requires --localstorage-file to work, so we override it.

  let store = loadStorage();

  const localStorage: Storage = {
    getItem(key: string): string | null {
      // Re-read from disk to pick up any changes
      store = loadStorage();
      return store[key] ?? null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
      saveStorage(store);
    },
    removeItem(key: string): void {
      delete store[key];
      saveStorage(store);
    },
    clear(): void {
      store = {};
      saveStorage(store);
    },
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null;
    },
    get length(): number {
      return Object.keys(store).length;
    },
  };

  Object.defineProperty(globalThis, 'localStorage', {
    value: localStorage,
    writable: false,
    configurable: true,
  });
}

// Polyfill browser APIs that @tidal-music/auth expects in Node.js

if (typeof globalThis.CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent<T = any> extends Event {
    detail: T;
    constructor(type: string, params?: { detail?: T; bubbles?: boolean; cancelable?: boolean; composed?: boolean }) {
      super(type, params);
      this.detail = params?.detail as T;
    }
  };
}

// EventTarget-based dispatchEvent/addEventListener for globalThis
if (typeof (globalThis as any).dispatchEvent !== 'function') {
  const target = new EventTarget();
  (globalThis as any).addEventListener = target.addEventListener.bind(target);
  (globalThis as any).removeEventListener = target.removeEventListener.bind(target);
  (globalThis as any).dispatchEvent = target.dispatchEvent.bind(target);
}
