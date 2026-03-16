import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// We need to test getCountryCode specifically, which itself calls getApiClient internally.
// The challenge: getCountryCode is in the same module as getApiClient, so we can't mock
// getApiClient from within the same module easily. Instead, we mock the dependencies
// that getApiClient uses, or we test getCountryCode by mocking the module partially.

// Strategy: We re-export getCountryCode and mock the module's internal getApiClient.
// Since getCountryCode calls getApiClient internally, we need to mock the entire auth module
// but keep getCountryCode real. We'll use a different approach: mock the underlying dependencies.

// Actually, the simplest approach: mock @tidal-music/auth and @tidal-music/api
// so that getApiClient returns our mock client, then test getCountryCode directly.

vi.mock('../session', () => ({
  installLocalStorage: vi.fn(),
}));

vi.mock('@tidal-music/auth', () => ({
  init: vi.fn().mockResolvedValue(undefined),
  initializeLogin: vi.fn(),
  finalizeLogin: vi.fn(),
  credentialsProvider: {
    getCredentials: vi.fn().mockResolvedValue({ token: 'fake-token', userId: 'user-1' }),
  },
  logout: vi.fn(),
}));

vi.mock('@tidal-music/api', () => ({
  createAPIClient: vi.fn(),
}));

import { createAPIClient } from '@tidal-music/api';

let output: string[] = [];
let errorOutput: string[] = [];

beforeEach(() => {
  output = [];
  errorOutput = [];
  vi.spyOn(console, 'log').mockImplementation((...args) => output.push(args.join(' ')));
  vi.spyOn(console, 'error').mockImplementation((...args) => errorOutput.push(args.join(' ')));
  vi.spyOn(process, 'exit').mockImplementation((code) => {
    throw new Error(`process.exit(${code})`);
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getCountryCode', () => {
  it('returns country from user profile API', async () => {
    const mockClient = {
      GET: vi.fn().mockResolvedValue({
        data: {
          data: {
            attributes: { country: 'CH' },
          },
        },
      }),
    };
    (createAPIClient as any).mockReturnValue(mockClient);

    // Need fresh import to reset cachedCountryCode
    vi.resetModules();

    // Re-mock after resetModules
    vi.doMock('../session', () => ({ installLocalStorage: vi.fn() }));
    vi.doMock('@tidal-music/auth', () => ({
      init: vi.fn().mockResolvedValue(undefined),
      credentialsProvider: {
        getCredentials: vi.fn().mockResolvedValue({ token: 'fake-token' }),
      },
      initializeLogin: vi.fn(),
      finalizeLogin: vi.fn(),
      logout: vi.fn(),
    }));
    vi.doMock('@tidal-music/api', () => ({
      createAPIClient: vi.fn().mockReturnValue(mockClient),
    }));

    const auth = await import('../auth');
    const country = await auth.getCountryCode();
    expect(country).toBe('CH');
  });

  it('caches the result on second call', async () => {
    const mockClient = {
      GET: vi.fn().mockResolvedValue({
        data: { data: { attributes: { country: 'DE' } } },
      }),
    };

    vi.resetModules();
    vi.doMock('../session', () => ({ installLocalStorage: vi.fn() }));
    vi.doMock('@tidal-music/auth', () => ({
      init: vi.fn().mockResolvedValue(undefined),
      credentialsProvider: {
        getCredentials: vi.fn().mockResolvedValue({ token: 'fake-token' }),
      },
      initializeLogin: vi.fn(),
      finalizeLogin: vi.fn(),
      logout: vi.fn(),
    }));
    vi.doMock('@tidal-music/api', () => ({
      createAPIClient: vi.fn().mockReturnValue(mockClient),
    }));

    const auth = await import('../auth');

    const first = await auth.getCountryCode();
    expect(first).toBe('DE');

    // Second call should use cache, not call API again
    const second = await auth.getCountryCode();
    expect(second).toBe('DE');

    // GET was called once for getApiClient's credential check, and once for the user endpoint
    // On second call, it should not call GET for the user endpoint again
    // The total GET calls after 2 getCountryCode calls should be 1 (from first call only)
    expect(mockClient.GET).toHaveBeenCalledTimes(1);
  });

  it('falls back to env var when API fails', async () => {
    const mockClient = {
      GET: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    vi.resetModules();
    vi.doMock('../session', () => ({ installLocalStorage: vi.fn() }));
    vi.doMock('@tidal-music/auth', () => ({
      init: vi.fn().mockResolvedValue(undefined),
      credentialsProvider: {
        getCredentials: vi.fn().mockResolvedValue({ token: 'fake-token' }),
      },
      initializeLogin: vi.fn(),
      finalizeLogin: vi.fn(),
      logout: vi.fn(),
    }));
    vi.doMock('@tidal-music/api', () => ({
      createAPIClient: vi.fn().mockReturnValue(mockClient),
    }));

    const originalEnv = process.env.TIDAL_COUNTRY;
    process.env.TIDAL_COUNTRY = 'FR';

    try {
      const auth = await import('../auth');
      const country = await auth.getCountryCode();
      expect(country).toBe('FR');
    } finally {
      if (originalEnv === undefined) {
        delete process.env.TIDAL_COUNTRY;
      } else {
        process.env.TIDAL_COUNTRY = originalEnv;
      }
    }
  });

  it('falls back to US when nothing is set', async () => {
    const mockClient = {
      GET: vi.fn().mockRejectedValue(new Error('Network error')),
    };

    vi.resetModules();
    vi.doMock('../session', () => ({ installLocalStorage: vi.fn() }));
    vi.doMock('@tidal-music/auth', () => ({
      init: vi.fn().mockResolvedValue(undefined),
      credentialsProvider: {
        getCredentials: vi.fn().mockResolvedValue({ token: 'fake-token' }),
      },
      initializeLogin: vi.fn(),
      finalizeLogin: vi.fn(),
      logout: vi.fn(),
    }));
    vi.doMock('@tidal-music/api', () => ({
      createAPIClient: vi.fn().mockReturnValue(mockClient),
    }));

    const originalEnv = process.env.TIDAL_COUNTRY;
    delete process.env.TIDAL_COUNTRY;

    try {
      const auth = await import('../auth');
      const country = await auth.getCountryCode();
      expect(country).toBe('US');
    } finally {
      if (originalEnv !== undefined) {
        process.env.TIDAL_COUNTRY = originalEnv;
      }
    }
  });
});
