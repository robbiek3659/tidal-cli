import { getApiClient } from './auth';

export async function getUserProfile(json: boolean): Promise<void> {
  const client = await getApiClient();

  const { data, error } = await client.GET('/users/me' as any, {
    params: {},
  });

  if (error || !data) {
    console.error(`Error: Failed to get user profile — ${JSON.stringify(error)}`);
    process.exit(1);
  }

  const attrs = (data as any).data?.attributes ?? {};
  const result = {
    id: (data as any).data?.id,
    username: attrs.username,
    country: attrs.country,
    email: attrs.email,
  };

  if (json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log('\nUser profile:');
  if (result.id) console.log(`  ID: ${result.id}`);
  if (result.username) console.log(`  Username: ${result.username}`);
  if (result.country) console.log(`  Country: ${result.country}`);
  if (result.email) console.log(`  Email: ${result.email}`);
  console.log();
}
