import { getApiClient, getCountryCode } from './auth';

export async function getRecommendations(json: boolean): Promise<void> {
  const client = await getApiClient();

  const { data, error } = await client.GET('/userRecommendations/me' as any, {
    params: {
      query: {
        countryCode: await getCountryCode(),
        include: ['discoveryMixes', 'myMixes', 'newArrivalMixes'] as any,
      } as any,
    },
  });

  if (error || !data) {
    console.error(`Error: Failed to get recommendations — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  const included = (data as any).included ?? [];

  if (json) {
    console.log(JSON.stringify(included, null, 2));
    return;
  }

  if (included.length === 0) {
    console.log('No recommendations found.');
    return;
  }

  console.log('\nYour recommendations:\n');
  for (const item of included) {
    const attrs = item.attributes as any;
    const name = attrs?.title ?? attrs?.name ?? 'Untitled';
    console.log(`  [${item.id}] (${item.type}) ${name}`);
  }
  console.log();
}
