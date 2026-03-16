import { getApiClient, getCountryCode } from './auth';

interface PlaylistInfo {
  id: string;
  name: string;
  description?: string;
  numberOfItems?: number;
  createdAt?: string;
  lastModifiedAt?: string;
}

export async function listPlaylists(json: boolean): Promise<void> {
  const client = await getApiClient();

  const { data, error } = await client.GET('/playlists', {
    params: {
      query: {
        'filter[owners.id]': ['me'] as any,
        countryCode: await getCountryCode(),
      },
    },
  });

  if (error || !data) {
    console.error(`Error: Failed to list playlists — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  const playlists: PlaylistInfo[] = ((data as any).data ?? []).map((p: any) => ({
    id: p.id,
    name: p.attributes?.name ?? 'Untitled',
    description: p.attributes?.description,
    numberOfItems: p.attributes?.numberOfItems,
    createdAt: p.attributes?.createdAt,
    lastModifiedAt: p.attributes?.lastModifiedAt,
  }));

  if (json) {
    console.log(JSON.stringify(playlists, null, 2));
    return;
  }

  if (playlists.length === 0) {
    console.log('No playlists found.');
    return;
  }

  console.log('\nYour playlists:\n');
  for (const p of playlists) {
    console.log(`  [${p.id}] ${p.name} (${p.numberOfItems ?? 0} tracks)`);
    if (p.description) console.log(`    ${p.description}`);
  }
  console.log();
}

export async function createPlaylist(name: string, description: string, json: boolean): Promise<void> {
  const client = await getApiClient();

  const { data, error } = await client.POST('/playlists', {
    body: {
      data: {
        type: 'playlists',
        attributes: {
          name,
          description,
          accessType: 'UNLISTED',
        },
      },
    } as any,
  });

  if (error || !data) {
    console.error(`Error: Failed to create playlist — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  const created = (data as any).data;
  const result = {
    id: created.id,
    name: created.attributes?.name ?? name,
    description: created.attributes?.description ?? description,
  };

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`\nPlaylist created: [${result.id}] ${result.name}`);
}

export async function renamePlaylist(playlistId: string, name: string, json: boolean): Promise<void> {
  const client = await getApiClient();

  const { error } = await client.PATCH('/playlists/{id}', {
    params: { path: { id: playlistId } },
    body: {
      data: {
        type: 'playlists',
        id: playlistId,
        attributes: { name },
      },
    } as any,
  });

  if (error) {
    console.error(`Error: Failed to rename playlist — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ id: playlistId, name, success: true }, null, 2));
    return;
  }

  console.log(`\nPlaylist ${playlistId} renamed to "${name}".`);
}

export async function deletePlaylist(playlistId: string, json: boolean): Promise<void> {
  const client = await getApiClient();

  const { error } = await client.DELETE('/playlists/{id}', {
    params: { path: { id: playlistId } },
  });

  if (error) {
    console.error(`Error: Failed to delete playlist — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ id: playlistId, deleted: true }, null, 2));
    return;
  }

  console.log(`\nPlaylist ${playlistId} deleted.`);
}

export async function addTrackToPlaylist(playlistId: string, trackId: string, json: boolean): Promise<void> {
  const client = await getApiClient();

  const { error } = await client.POST('/playlists/{id}/relationships/items' as any, {
    params: { path: { id: playlistId } },
    body: {
      data: [{ id: trackId, type: 'tracks' }],
    },
  });

  if (error) {
    console.error(`Error: Failed to add track — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ playlistId, trackId, added: true }, null, 2));
    return;
  }

  console.log(`\nTrack ${trackId} added to playlist ${playlistId}.`);
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string, json: boolean): Promise<void> {
  const client = await getApiClient();

  // Get playlist items to find the item index (required by the API)
  const { data: itemsData, error: itemsError } = await client.GET('/playlists/{id}/relationships/items' as any, {
    params: { path: { id: playlistId } },
  });

  if (itemsError || !itemsData) {
    console.error(`Error: Failed to get playlist items — ${JSON.stringify(itemsError)}`);
    process.exit(1);
  }

  const items = (itemsData as any).data ?? [];
  const item = items.find((i: any) => i.id === trackId);
  if (!item) {
    console.error(`Error: Track ${trackId} not found in playlist ${playlistId}.`);
    process.exit(1);
  }

  const { error } = await client.DELETE('/playlists/{id}/relationships/items' as any, {
    params: { path: { id: playlistId } },
    body: {
      data: [{ id: trackId, type: 'tracks', meta: { itemId: item.meta.itemId } }],
    },
  });

  if (error) {
    console.error(`Error: Failed to remove track — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ playlistId, trackId, removed: true }, null, 2));
    return;
  }

  console.log(`\nTrack ${trackId} removed from playlist ${playlistId}.`);
}

export async function addAlbumToPlaylist(playlistId: string, albumId: string, json: boolean): Promise<void> {
  const client = await getApiClient();

  // First get album tracks
  const { data: albumData, error: albumError } = await client.GET('/albums/{id}', {
    params: {
      path: { id: albumId },
      query: { countryCode: await getCountryCode(), include: ['items'] as any },
    },
  });

  if (albumError || !albumData) {
    console.error(`Error: Failed to get album — ${JSON.stringify(albumError)}`);
    process.exit(1);
  }

  // Extract track IDs from included items
  const included = (albumData as any).included ?? [];
  const trackIds = included
    .filter((item: any) => item.type === 'tracks')
    .map((item: any) => ({ id: item.id, type: 'tracks' }));

  if (trackIds.length === 0) {
    console.error('Error: No tracks found in album.');
    process.exit(1);
  }

  const { error } = await client.POST('/playlists/{id}/relationships/items' as any, {
    params: { path: { id: playlistId } },
    body: { data: trackIds },
  });

  if (error) {
    console.error(`Error: Failed to add album tracks — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ playlistId, albumId, tracksAdded: trackIds.length }, null, 2));
    return;
  }

  console.log(`\n${trackIds.length} tracks from album ${albumId} added to playlist ${playlistId}.`);
}

export async function moveTrackInPlaylist(
  playlistId: string,
  trackId: string,
  positionBefore: string,
  json: boolean,
): Promise<void> {
  const client = await getApiClient();

  // Get playlist items to find the itemId for the track
  const { data: itemsData, error: itemsError } = await client.GET('/playlists/{id}/relationships/items' as any, {
    params: { path: { id: playlistId } },
  });

  if (itemsError || !itemsData) {
    console.error(`Error: Failed to get playlist items — ${JSON.stringify(itemsError)}`);
    process.exit(1);
  }

  const items = (itemsData as any).data ?? [];
  const item = items.find((i: any) => i.id === trackId);
  if (!item) {
    console.error(`Error: Track ${trackId} not found in playlist ${playlistId}.`);
    process.exit(1);
  }

  const itemId = item.meta?.itemId;
  if (!itemId) {
    console.error(`Error: Could not find itemId for track ${trackId}.`);
    process.exit(1);
  }

  const meta: any = {};
  if (positionBefore !== 'end') {
    meta.positionBefore = positionBefore;
  }

  const { error } = await (client as any).PATCH('/playlists/{id}/relationships/items', {
    params: { path: { id: playlistId } },
    body: {
      data: [{ id: trackId, type: 'tracks', meta: { itemId } }],
      meta,
    },
  });

  if (error) {
    console.error(`Error: Failed to move track — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ playlistId, trackId, positionBefore, moved: true }, null, 2));
    return;
  }

  const posDesc = positionBefore === 'end' ? 'to end of playlist' : `before item ${positionBefore}`;
  console.log(`\nTrack ${trackId} moved ${posDesc} in playlist ${playlistId}.`);
}

export async function updatePlaylistDescription(
  playlistId: string,
  description: string,
  json: boolean,
): Promise<void> {
  const client = await getApiClient();

  const { error } = await client.PATCH('/playlists/{id}', {
    params: { path: { id: playlistId } },
    body: {
      data: {
        type: 'playlists',
        id: playlistId,
        attributes: { description },
      },
    } as any,
  });

  if (error) {
    console.error(`Error: Failed to update playlist description — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ id: playlistId, description, success: true }, null, 2));
    return;
  }

  console.log(`\nPlaylist ${playlistId} description updated.`);
}
