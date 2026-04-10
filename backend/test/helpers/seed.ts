/**
 * Seed helpers for integration tests.
 * All functions return created entities so tests can reference IDs.
 */
import { DataSource } from 'typeorm';

export async function seedUser(
  ds: DataSource,
  overrides: Partial<{ clerk_id: string; email: string; name: string; plan: string }> = {},
) {
  const result = await ds.query(
    `INSERT INTO users (clerk_id, email, name, plan)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (clerk_id) DO UPDATE SET email = EXCLUDED.email
     RETURNING *`,
    [
      overrides.clerk_id ?? 'test-clerk-id',
      overrides.email ?? 'test@example.com',
      overrides.name ?? 'Test User',
      overrides.plan ?? 'free',
    ],
  );
  return result[0];
}

export async function seedSearch(
  ds: DataSource,
  userId: string,
  overrides: Partial<{ raw_input: string; status: string; result_count: number }> = {},
) {
  const result = await ds.query(
    `INSERT INTO searches (user_id, raw_input, status, result_count)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [
      userId,
      overrides.raw_input ?? 'Test idea for fintech startup',
      overrides.status ?? 'complete',
      overrides.result_count ?? 0,
    ],
  );
  return result[0];
}

export async function seedInvestorProfile(
  ds: DataSource,
  searchId: string,
  overrides: Partial<{ canonical_name: string; fit_score: number }> = {},
) {
  const result = await ds.query(
    `INSERT INTO investor_profiles (search_id, canonical_name, sectors, stages, geo_focus, sources, source_urls, fit_score, rank_position)
     VALUES ($1, $2, '{}', '{}', '{}', '{}', '{}', $3, 1)
     RETURNING *`,
    [searchId, overrides.canonical_name ?? 'Sequoia Capital', overrides.fit_score ?? 85],
  );
  return result[0];
}

export async function cleanupUser(ds: DataSource, clerkId: string) {
  await ds.query(`DELETE FROM users WHERE clerk_id = $1`, [clerkId]);
}
