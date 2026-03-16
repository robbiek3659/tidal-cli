import { getApiClient } from './auth';

type LibraryResourceType = 'artist' | 'album' | 'track' | 'video';

const collectionEndpoints: Record<LibraryResourceType, { path: string; type: string }> = {
  artist: { path: '/userCollectionArtists/{id}/relationships/items', type: 'artists' },
  album: { path: '/userCollectionAlbums/{id}/relationships/items', type: 'albums' },
  track: { path: '/userCollectionTracks/{id}/relationships/items', type: 'tracks' },
  video: { path: '/userCollectionVideos/{id}/relationships/items', type: 'videos' },
};

export async function addToLibrary(
  resourceType: LibraryResourceType,
  resourceId: string,
  json: boolean,
): Promise<void> {
  const client = await getApiClient();
  const endpoint = collectionEndpoints[resourceType];

  const { error } = await (client as any).POST(endpoint.path, {
    params: { path: { id: 'me' } },
    body: {
      data: [{ id: resourceId, type: endpoint.type }],
    },
  });

  if (error) {
    console.error(`Error: Failed to add ${resourceType} to library — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ resourceType, resourceId, added: true }, null, 2));
    return;
  }

  console.log(`\n${capitalize(resourceType)} ${resourceId} added to your library.`);
}

export async function removeFromLibrary(
  resourceType: LibraryResourceType,
  resourceId: string,
  json: boolean,
): Promise<void> {
  const client = await getApiClient();
  const endpoint = collectionEndpoints[resourceType];

  const { error } = await (client as any).DELETE(endpoint.path, {
    params: { path: { id: 'me' } },
    body: {
      data: [{ id: resourceId, type: endpoint.type }],
    },
  });

  if (error) {
    console.error(`Error: Failed to remove ${resourceType} from library — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ resourceType, resourceId, removed: true }, null, 2));
    return;
  }

  console.log(`\n${capitalize(resourceType)} ${resourceId} removed from your library.`);
}

export async function listFavoritedPlaylists(json: boolean): Promise<void> {
  const client = await getApiClient();

  const { data, error } = await (client as any).GET('/userCollectionPlaylists/{id}/relationships/items', {
    params: {
      path: { id: 'me' },
      query: {
        include: ['items'] as any,
      } as any,
    },
  });

  if (error || !data) {
    console.error(`Error: Failed to list favorited playlists — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  const included = (data as any).included ?? [];
  const playlists = included
    .filter((item: any) => item.type === 'playlists')
    .map((item: any) => {
      const attrs = item.attributes as any;
      return {
        id: item.id,
        name: attrs?.name ?? 'Unknown',
        numberOfItems: attrs?.numberOfItems,
      };
    });

  if (json) {
    console.log(JSON.stringify(playlists, null, 2));
    return;
  }

  if (playlists.length === 0) {
    console.log('No favorited playlists found.');
    return;
  }

  console.log('\nFavorited playlists:\n');
  for (const p of playlists) {
    console.log(`  [${p.id}] ${p.name} (${p.numberOfItems ?? 0} items)`);
  }
  console.log();
}

export async function addPlaylistToFavorites(playlistId: string, json: boolean): Promise<void> {
  const client = await getApiClient();

  const { error } = await (client as any).POST('/userCollectionPlaylists/{id}/relationships/items', {
    params: { path: { id: 'me' } },
    body: {
      data: [{ id: playlistId, type: 'playlists' }],
    },
  });

  if (error) {
    console.error(`Error: Failed to add playlist to favorites — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ playlistId, added: true }, null, 2));
    return;
  }

  console.log(`\nPlaylist ${playlistId} added to favorites.`);
}

export async function removePlaylistFromFavorites(playlistId: string, json: boolean): Promise<void> {
  const client = await getApiClient();

  const { error } = await (client as any).DELETE('/userCollectionPlaylists/{id}/relationships/items', {
    params: { path: { id: 'me' } },
    body: {
      data: [{ id: playlistId, type: 'playlists' }],
    },
  });

  if (error) {
    console.error(`Error: Failed to remove playlist from favorites — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  if (json) {
    console.log(JSON.stringify({ playlistId, removed: true }, null, 2));
    return;
  }

  console.log(`\nPlaylist ${playlistId} removed from favorites.`);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
