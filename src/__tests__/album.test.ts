import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../auth', () => ({
  getApiClient: vi.fn(),
  getCountryCode: vi.fn().mockResolvedValue('US'),
}));

import { getApiClient, getCountryCode } from '../auth';
import { getAlbumInfo, getAlbumByBarcode } from '../album';

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

describe('getAlbumInfo', () => {
  it('displays album info with included artists', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: {
          attributes: {
            title: 'Mezzanine',
            albumType: 'ALBUM',
            releaseDate: '1998-04-20',
            numberOfItems: 11,
            duration: 'PT1H3M29S',
            popularity: 75,
            explicit: false,
            barcodeId: '0724384497828',
          },
        },
        included: [
          { id: 'a-1', type: 'artists', attributes: { name: 'Massive Attack' } },
        ],
      },
    });

    await getAlbumInfo('alb-1', false);

    expect(output.some((l) => l.includes('[alb-1] Mezzanine'))).toBe(true);
    expect(output.some((l) => l.includes('Artists: Massive Attack'))).toBe(true);
    expect(output.some((l) => l.includes('Type: ALBUM'))).toBe(true);
    expect(output.some((l) => l.includes('Release Date: 1998-04-20'))).toBe(true);
    expect(output.some((l) => l.includes('Tracks: 11'))).toBe(true);
    expect(output.some((l) => l.includes('Duration: 1:03:29'))).toBe(true);
    expect(output.some((l) => l.includes('Popularity: 75'))).toBe(true);
    expect(output.some((l) => l.includes('Barcode: 0724384497828'))).toBe(true);
  });

  it('outputs JSON with artist names', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: {
          attributes: {
            title: 'Blue Lines',
            albumType: 'ALBUM',
            releaseDate: '1991-04-08',
            numberOfItems: 9,
            duration: 'PT45M2S',
            popularity: 60,
            explicit: true,
            barcodeId: '0077778611424',
          },
        },
        included: [
          { id: 'a-1', type: 'artists', attributes: { name: 'Massive Attack' } },
        ],
      },
    });

    await getAlbumInfo('alb-2', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed.id).toBe('alb-2');
    expect(parsed.title).toBe('Blue Lines');
    expect(parsed.artists).toEqual(['Massive Attack']);
    expect(parsed.albumType).toBe('ALBUM');
    expect(parsed.duration).toBe('45:02');
    expect(parsed.barcodeId).toBe('0077778611424');
  });

  it('handles multiple artists', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: { attributes: { title: 'Collab Album' } },
        included: [
          { id: 'a-1', type: 'artists', attributes: { name: 'Artist One' } },
          { id: 'a-2', type: 'artists', attributes: { name: 'Artist Two' } },
        ],
      },
    });

    await getAlbumInfo('alb-3', false);

    expect(output.some((l) => l.includes('Artists: Artist One, Artist Two'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 404 } });

    await expect(getAlbumInfo('bad', false)).rejects.toThrow('process.exit(1)');
  });
});

describe('getAlbumByBarcode', () => {
  it('returns matching albums', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: [
          {
            id: 'alb-1',
            attributes: {
              title: 'Mezzanine',
              albumType: 'ALBUM',
              releaseDate: '1998-04-20',
              numberOfItems: 11,
              duration: 'PT63M29S',
              barcodeId: '0724384497828',
            },
          },
        ],
      },
    });

    await getAlbumByBarcode('0724384497828', false);

    expect(output.some((l) => l.includes('[alb-1] Mezzanine'))).toBe(true);
    expect(output.some((l) => l.includes('ALBUM'))).toBe(true);
  });

  it('outputs JSON', async () => {
    mockClient.GET.mockResolvedValue({
      data: {
        data: [
          {
            id: 'alb-1',
            attributes: {
              title: 'Mezzanine',
              albumType: 'ALBUM',
              releaseDate: '1998-04-20',
              numberOfItems: 11,
              duration: 'PT63M29S',
              barcodeId: '0724384497828',
            },
          },
        ],
      },
    });

    await getAlbumByBarcode('0724384497828', true);

    const parsed = JSON.parse(output.join(''));
    expect(parsed).toHaveLength(1);
    expect(parsed[0].title).toBe('Mezzanine');
    expect(parsed[0].barcodeId).toBe('0724384497828');
  });

  it('shows empty message when no albums found', async () => {
    mockClient.GET.mockResolvedValue({
      data: { data: [] },
    });

    await getAlbumByBarcode('0000000000000', false);

    expect(output.some((l) => l.includes('No albums found for barcode'))).toBe(true);
  });

  it('exits on error', async () => {
    mockClient.GET.mockResolvedValue({ data: null, error: { status: 500 } });

    await expect(getAlbumByBarcode('bad', false)).rejects.toThrow('process.exit(1)');
  });
});
