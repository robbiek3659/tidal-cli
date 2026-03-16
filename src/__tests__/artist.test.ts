import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../auth', () => ({
  getApiClient: vi.fn(),
  getCountryCode: vi.fn().mockResolvedValue('US'),
}));

import { getApiClient, getCountryCode } from '../auth';
import { getArtistInfo, getArtistTracks, getArtistAlbums, getSimilarArtists, getArtistRadio } from '../artist';

const mockClient = {
  GET: vi.fn(),
  POST: vi.fn(),
  PATCH: vi.fn(),
  DELETE: vi.fn(),
};

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
  vi.clearAllMocks();
  (getApiClient as any).mockResolvedValue(mockClient);
  (getCountryCode as any).mockResolvedValue('US');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getArtistInfo', () => {
  it('displays artist info with biography', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: {
          attributes: {
            name: 'Massive Attack',
            popularity: 78,
            handle: 'massiveattack',
          },
        },
        included: [
          {
            type: 'artistBiographies',
            attributes: { text: 'Bristol-based trip hop group.' },
          },
        ],
      },
    });

    await getArtistInfo('art-1', false);

    expect(output.some((l) => l.includes('[art-1] Massive Attack'))).toBe(true);
    expect(output.some((l) => l.includes('Popularity: 78'))).toBe(true);
    expect(output.some((l) => l.includes('Handle: massiveattack'))).toBe(true);
    expect(output.some((l) => l.includes('Bristol-based trip hop group'))).toBe(true);
  });

  it('outputs JSON', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: {
          attributes: { name: 'Bjork', popularity: 72 },
        },
        included: [],
      },
    });

    await getArtistInfo('art-2', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed.id).toBe('art-2');
    expect(parsed.name).toBe('Bjork');
    expect(parsed.popularity).toBe(72);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 404 } });

    await expect(getArtistInfo('bad', false)).rejects.toThrow('process.exit(1)');
  });
});

describe('getArtistTracks', () => {
  it('returns tracks from included data', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        included: [
          {
            id: 't-1',
            type: 'tracks',
            attributes: { title: 'Teardrop', duration: 'PT5M31S', isrc: 'GBDCA9800001', popularity: 85 },
          },
          {
            id: 't-2',
            type: 'tracks',
            attributes: { title: 'Angel', duration: 'PT6M18S', isrc: 'GBDCA9800002', popularity: 70 },
          },
        ],
      },
    });

    await getArtistTracks('art-1', false);

    expect(output.some((l) => l.includes('[t-1] Teardrop'))).toBe(true);
    expect(output.some((l) => l.includes('[t-2] Angel'))).toBe(true);
  });

  it('outputs JSON', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        included: [
          { id: 't-1', type: 'tracks', attributes: { title: 'Teardrop', popularity: 85 } },
        ],
      },
    });

    await getArtistTracks('art-1', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Teardrop');
  });

  it('shows empty message when no tracks', async () => {
    mockClient.GET.mockResolvedValue({ data: { included: [] } });

    await getArtistTracks('art-1', false);

    expect(output.some((l) => l.includes('No tracks found'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 500 } });

    await expect(getArtistTracks('art-1', false)).rejects.toThrow('process.exit(1)');
  });
});

describe('getArtistAlbums', () => {
  it('returns albums from included data', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        included: [
          {
            id: 'alb-1',
            type: 'albums',
            attributes: { title: 'Mezzanine', albumType: 'ALBUM', releaseDate: '1998-04-20', numberOfItems: 11 },
          },
          {
            id: 'alb-2',
            type: 'albums',
            attributes: { title: 'Blue Lines', albumType: 'ALBUM', releaseDate: '1991-04-08', numberOfItems: 9 },
          },
        ],
      },
    });

    await getArtistAlbums('art-1', false);

    expect(output.some((l) => l.includes('[alb-1] Mezzanine'))).toBe(true);
    expect(output.some((l) => l.includes('[alb-2] Blue Lines'))).toBe(true);
  });

  it('outputs JSON', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        included: [
          { id: 'alb-1', type: 'albums', attributes: { title: 'Mezzanine', albumType: 'ALBUM' } },
        ],
      },
    });

    await getArtistAlbums('art-1', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Mezzanine');
    expect(parsed[0].albumType).toBe('ALBUM');
  });

  it('shows empty message when no albums', async () => {
    mockClient.GET.mockResolvedValue({ data: { included: [] } });

    await getArtistAlbums('art-1', false);

    expect(output.some((l) => l.includes('No albums found'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 500 } });

    await expect(getArtistAlbums('art-1', false)).rejects.toThrow('process.exit(1)');
  });
});

describe('getSimilarArtists', () => {
  it('returns similar artists from included data', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        included: [
          { id: 'a-10', type: 'artists', attributes: { name: 'Portishead', popularity: 65 } },
          { id: 'a-11', type: 'artists', attributes: { name: 'Tricky', popularity: 50 } },
        ],
      },
    });

    await getSimilarArtists('art-1', false);

    expect(output.some((l) => l.includes('[a-10] Portishead'))).toBe(true);
    expect(output.some((l) => l.includes('[a-11] Tricky'))).toBe(true);
  });

  it('outputs JSON', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        included: [
          { id: 'a-10', type: 'artists', attributes: { name: 'Portishead', popularity: 65 } },
        ],
      },
    });

    await getSimilarArtists('art-1', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].name).toBe('Portishead');
  });

  it('shows empty message', async () => {
    mockClient.GET.mockResolvedValue({ data: { included: [] } });

    await getSimilarArtists('art-1', false);

    expect(output.some((l) => l.includes('No similar artists found'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 500 } });

    await expect(getSimilarArtists('art-1', false)).rejects.toThrow('process.exit(1)');
  });
});

describe('getArtistRadio', () => {
  it('returns playlist data (NOT tracks)', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: [
          { id: 'mix-1', type: 'playlists' },
        ],
        included: [
          {
            id: 'mix-1',
            type: 'playlists',
            attributes: { name: 'Massive Attack Radio', numberOfItems: 30, description: 'Curated radio mix' },
          },
        ],
      },
    });

    await getArtistRadio('art-1', false);

    expect(output.some((l) => l.includes('[mix-1] Massive Attack Radio'))).toBe(true);
    expect(output.some((l) => l.includes('30 tracks'))).toBe(true);
  });

  it('outputs JSON with playlist structure', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: [{ id: 'mix-1', type: 'playlists' }],
        included: [
          {
            id: 'mix-1',
            type: 'playlists',
            attributes: { name: 'Radio Mix', numberOfItems: 25, description: 'Auto mix' },
          },
        ],
      },
    });

    await getArtistRadio('art-1', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe('mix-1');
    expect(parsed[0].type).toBe('playlists');
    expect(parsed[0].name).toBe('Radio Mix');
    expect(parsed[0].numberOfItems).toBe(25);
  });

  it('shows empty message when no radio', async () => {
    mockClient.GET.mockResolvedValue({
      data: { data: [], included: [] },
    });

    await getArtistRadio('art-1', false);

    expect(output.some((l) => l.includes('No radio found'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 500 } });

    await expect(getArtistRadio('art-1', false)).rejects.toThrow('process.exit(1)');
  });
});
