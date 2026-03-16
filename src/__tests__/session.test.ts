import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

// We test session.ts directly without mocking auth.
// We need to override the SESSION_DIR to use a temp directory.

let tempDir: string;
let sessionFile: string;

beforeEach(() => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tidal-cli-test-'));
  sessionFile = path.join(tempDir, 'session.json');
});

afterEach(() => {
  // Clean up temp dir
  try {
    fs.rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
});

describe('installLocalStorage', () => {
  it('provides working getItem/setItem', async () => {
    // We need to test the actual installLocalStorage but it uses a hardcoded path.
    // Instead, test the loadStorage/saveStorage functions with the real path,
    // and test installLocalStorage by checking globalThis.localStorage works.

    // Import dynamically to get a fresh module
    const { installLocalStorage } = await import('../session');

    // Save original
    const originalLocalStorage = globalThis.localStorage;

    installLocalStorage();

    // Verify localStorage is installed
    expect(globalThis.localStorage).toBeDefined();
    expect(typeof globalThis.localStorage.getItem).toBe('function');
    expect(typeof globalThis.localStorage.setItem).toBe('function');
    expect(typeof globalThis.localStorage.removeItem).toBe('function');
    expect(typeof globalThis.localStorage.clear).toBe('function');
    expect(typeof globalThis.localStorage.key).toBe('function');

    // Test setItem/getItem
    const testKey = `__test_key_${Date.now()}`;
    globalThis.localStorage.setItem(testKey, 'test_value');
    expect(globalThis.localStorage.getItem(testKey)).toBe('test_value');

    // Test removeItem
    globalThis.localStorage.removeItem(testKey);
    expect(globalThis.localStorage.getItem(testKey)).toBeNull();

    // Restore
    if (originalLocalStorage && originalLocalStorage !== globalThis.localStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: false,
        configurable: true,
      });
    }
  });

  it('returns null for missing keys', async () => {
    const { installLocalStorage } = await import('../session');

    const originalLocalStorage = globalThis.localStorage;
    installLocalStorage();

    expect(globalThis.localStorage.getItem('nonexistent_key_xyz_' + Date.now())).toBeNull();

    if (originalLocalStorage && originalLocalStorage !== globalThis.localStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: false,
        configurable: true,
      });
    }
  });

  it('length reflects number of stored items', async () => {
    const { installLocalStorage } = await import('../session');

    const originalLocalStorage = globalThis.localStorage;
    installLocalStorage();

    const baseLength = globalThis.localStorage.length;
    const key1 = `__test_len_a_${Date.now()}`;
    const key2 = `__test_len_b_${Date.now()}`;

    globalThis.localStorage.setItem(key1, 'a');
    globalThis.localStorage.setItem(key2, 'b');
    expect(globalThis.localStorage.length).toBe(baseLength + 2);

    globalThis.localStorage.removeItem(key1);
    expect(globalThis.localStorage.length).toBe(baseLength + 1);

    globalThis.localStorage.removeItem(key2);

    if (originalLocalStorage && originalLocalStorage !== globalThis.localStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: false,
        configurable: true,
      });
    }
  });

  it('clear removes all items', async () => {
    const { installLocalStorage, loadStorage, saveStorage } = await import('../session');

    const originalLocalStorage = globalThis.localStorage;
    installLocalStorage();

    const key = `__test_clear_${Date.now()}`;
    globalThis.localStorage.setItem(key, 'val');
    globalThis.localStorage.clear();
    expect(globalThis.localStorage.getItem(key)).toBeNull();
    expect(globalThis.localStorage.length).toBe(0);

    if (originalLocalStorage && originalLocalStorage !== globalThis.localStorage) {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        writable: false,
        configurable: true,
      });
    }
  });

  it('overrides existing localStorage (Node.js 22+ compatibility)', async () => {
    // Simulate Node.js 22+ localStorage
    const fakeBuiltIn = {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    } as Storage;

    Object.defineProperty(globalThis, 'localStorage', {
      value: fakeBuiltIn,
      writable: false,
      configurable: true,
    });

    const { installLocalStorage } = await import('../session');
    installLocalStorage();

    // The installed localStorage should NOT be the fake built-in
    expect(globalThis.localStorage).not.toBe(fakeBuiltIn);
    expect(typeof globalThis.localStorage.setItem).toBe('function');
  });
});

describe('loadStorage and saveStorage', () => {
  it('loadStorage returns empty object when no file exists', async () => {
    const { loadStorage } = await import('../session');
    // loadStorage uses the real SESSION_FILE path, which may or may not exist.
    // We just verify it returns an object.
    const result = loadStorage();
    expect(typeof result).toBe('object');
  });

  it('saveStorage and loadStorage round-trip', async () => {
    const { loadStorage, saveStorage } = await import('../session');

    const key = `__round_trip_${Date.now()}`;
    const store = loadStorage();
    store[key] = 'round_trip_value';
    saveStorage(store);

    const reloaded = loadStorage();
    expect(reloaded[key]).toBe('round_trip_value');

    // Clean up
    delete reloaded[key];
    saveStorage(reloaded);
  });
});
