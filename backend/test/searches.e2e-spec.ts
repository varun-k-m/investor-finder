/**
 * Integration tests: Search routes
 * Requires TEST_DATABASE_URL — skipped otherwise.
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './app.e2e-spec';
import { seedUser, seedSearch, seedInvestorProfile, cleanupUser } from './helpers/seed';

const TEST_CLERK_ID = 'e2e-searches-test-clerk';

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb('Searches E2E', () => {
  let app: INestApplication;
  let ds: DataSource;
  let userId: string;
  let searchId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    const user = await seedUser(ds, { clerk_id: TEST_CLERK_ID, email: 'e2e-searches@test.com' });
    userId = user.id;
    const search = await seedSearch(ds, userId, { status: 'complete', result_count: 1 });
    searchId = search.id;
    await seedInvestorProfile(ds, searchId, { canonical_name: 'Test VC', fit_score: 80 });
  });

  afterAll(async () => {
    await cleanupUser(ds, TEST_CLERK_ID);
    await app.close();
  });

  it('GET /api/v1/searches returns list of searches', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/searches')
      .set('x-test-clerk-id', TEST_CLERK_ID)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toMatchObject({ id: searchId, status: 'complete' });
  });

  it('GET /api/v1/searches/:id returns search', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/searches/${searchId}`)
      .set('x-test-clerk-id', TEST_CLERK_ID)
      .expect(200);

    expect(res.body).toMatchObject({ id: searchId });
  });

  it('GET /api/v1/searches/:id/investors returns paginated investors', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/searches/${searchId}/investors`)
      .set('x-test-clerk-id', TEST_CLERK_ID)
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/v1/searches returns 403 without auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/searches').expect(403);
  });
});
