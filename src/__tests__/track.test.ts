import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../auth', () => ({
  getApiClient: vi.fn(),
  getCountryCode: vi.fn().mockResolvedValue('US'),
}));

import { getApiClient, getCountryCode } from '../auth';
import { getTrackInfo, getSimilarTracks, getTrackRadio, getTrackByIsrc } from '../track';

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

describe('getTrackInfo', () => {
  it('displays track info with artists and album', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: {
          attributes: {
            title: 'Teardrop',
            duration: 'PT5M31S',
            isrc: 'GBDCA9800001',
            bpm: 76,
            key: 'Am',
            popularity: 85,
            explicit: false,
          },
        },
        included: [
          { id: 'a-1', type: 'artists', attributes: { name: 'Massive Attack' } },
          { id: 'alb-1', type: 'albums', attributes: { title: 'Mezzanine' } },
        ],
      },
    });

    await getTrackInfo('t-1', false);

    expect(output.some((l) => l.includes('[t-1] Teardrop'))).toBe(true);
    expect(output.some((l) => l.includes('Artists: Massive Attack'))).toBe(true);
    expect(output.some((l) => l.includes('Album: Mezzanine'))).toBe(true);
    expect(output.some((l) => l.includes('Duration: 5:31'))).toBe(true);
    expect(output.some((l) => l.includes('ISRC: GBDCA9800001'))).toBe(true);
    expect(output.some((l) => l.includes('BPM: 76'))).toBe(true);
    expect(output.some((l) => l.includes('Key: Am'))).toBe(true);
    expect(output.some((l) => l.includes('Popularity: 85'))).toBe(true);
  });

  it('outputs JSON with included artists and albums', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: {
          attributes: {
            title: 'Angel',
            duration: 'PT6M18S',
            isrc: 'GBDCA9800002',
            popularity: 70,
            explicit: false,
          },
        },
        included: [
          { id: 'a-1', type: 'artists', attributes: { name: 'Massive Attack' } },
          { id: 'a-2', type: 'artists', attributes: { name: 'Horace Andy' } },
          { id: 'alb-1', type: 'albums', attributes: { title: 'Mezzanine' } },
        ],
      },
    });

    await getTrackInfo('t-2', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed.id).toBe('t-2');
    expect(parsed.title).toBe('Angel');
    expect(parsed.artists).toEqual(['Massive Attack', 'Horace Andy']);
    expect(parsed.album).toBe('Mezzanine');
    expect(parsed.duration).toBe('6:18');
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 404 } });

    await expect(getTrackInfo('bad', false)).rejects.toThrow('process.exit(1)');
  });
});

describe('getSimilarTracks', () => {
  it('returns similar tracks from included data', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        included: [
          {
            id: 't-10',
            type: 'tracks',
            attributes: { title: 'Glory Box', duration: 'PT5M1S', isrc: 'GBARL9400099', popularity: 80 },
          },
          {
            id: 't-11',
            type: 'tracks',
            attributes: { title: 'Wandering Star', duration: 'PT4M50S', isrc: 'GBARL9400050', popularity: 60 },
          },
        ],
      },
    });

    await getSimilarTracks('t-1', false);

    expect(output.some((l) => l.includes('[t-10] Glory Box'))).toBe(true);
    expect(output.some((l) => l.includes('[t-11] Wandering Star'))).toBe(true);
  });

  it('outputs JSON', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        included: [
          { id: 't-10', type: 'tracks', attributes: { title: 'Glory Box', duration: 'PT5M1S', popularity: 80 } },
        ],
      },
    });

    await getSimilarTracks('t-1', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Glory Box');
    expect(parsed[0].duration).toBe('5:01');
  });

  it('shows empty message', async () => {
    mockClient.GET.mockResolvedValue({ data: { included: [] } });

    await getSimilarTracks('t-1', false);

    expect(output.some((l) => l.includes('No similar tracks found'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 500 } });

    await expect(getSimilarTracks('t-1', false)).rejects.toThrow('process.exit(1)');
  });
});

describe('getTrackRadio', () => {
  it('returns playlist data (NOT individual tracks)', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: [{ id: 'mix-1', type: 'playlists' }],
        included: [
          {
            id: 'mix-1',
            type: 'playlists',
            attributes: { name: 'Track Radio Mix', numberOfItems: 20 },
          },
        ],
      },
    });

    await getTrackRadio('t-1', false);

    expect(output.some((l) => l.includes('[mix-1] Track Radio Mix'))).toBe(true);
    expect(output.some((l) => l.includes('20 tracks'))).toBe(true);
  });

  it('outputs JSON with playlist structure', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: [{ id: 'mix-1', type: 'playlists' }],
        included: [
          {
            id: 'mix-1',
            type: 'playlists',
            attributes: { name: 'Radio', numberOfItems: 15 },
          },
        ],
      },
    });

    await getTrackRadio('t-1', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].type).toBe('playlists');
    expect(parsed[0].name).toBe('Radio');
  });

  it('shows empty message when no radio', async () => {
    mockClient.GET.mockResolvedValue({
      data: { data: [], included: [] },
    });

    await getTrackRadio('t-1', false);

    expect(output.some((l) => l.includes('No radio found'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 500 } });

    await expect(getTrackRadio('t-1', false)).rejects.toThrow('process.exit(1)');
  });
});

describe('getTrackByIsrc', () => {
  it('returns multiple tracks with artists resolved from included', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: [
          {
            id: 't-100',
            attributes: { title: 'Creep', duration: 'PT3M56S', isrc: 'GBAYE9200070', popularity: 90 },
            relationships: {
              artists: { data: [{ id: 'a-1', type: 'artists' }] },
            },
          },
          {
            id: 't-101',
            attributes: { title: 'Creep (Acoustic)', duration: 'PT4M10S', isrc: 'GBAYE9200070', popularity: 40 },
            relationships: {
              artists: { data: [{ id: 'a-1', type: 'artists' }, { id: 'a-2', type: 'artists' }] },
            },
          },
        ],
        included: [
          { id: 'a-1', type: 'artists', attributes: { name: 'Radiohead' } },
          { id: 'a-2', type: 'artists', attributes: { name: 'Some Collaborator' } },
        ],
      },
    });

    await getTrackByIsrc('GBAYE9200070', false);

    expect(output.some((l) => l.includes('[t-100] Creep'))).toBe(true);
    expect(output.some((l) => l.includes('Radiohead'))).toBe(true);
    expect(output.some((l) => l.includes('[t-101] Creep (Acoustic)'))).toBe(true);
  });

  it('outputs JSON with artist names resolved', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: [
          {
            id: 't-100',
            attributes: { title: 'Creep', duration: 'PT3M56S', isrc: 'GBAYE9200070', popularity: 90 },
            relationships: { artists: { data: [{ id: 'a-1', type: 'artists' }] } },
          },
        ],
        included: [
          { id: 'a-1', type: 'artists', attributes: { name: 'Radiohead' } },
        ],
      },
    });

    await getTrackByIsrc('GBAYE9200070', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].artists).toEqual(['Radiohead']);
    expect(parsed[0].duration).toBe('3:56');
  });

  it('shows empty message when no tracks found', async () => {
    mockClient.GET.mockResolvedValue({
      data: { data: [], included: [] },
    });

    await getTrackByIsrc('XXXX0000000', false);

    expect(output.some((l) => l.includes('No tracks found for ISRC'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 500 } });

    await expect(getTrackByIsrc('XXXX', false)).rejects.toThrow('process.exit(1)');
  });
});
