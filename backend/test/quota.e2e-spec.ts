/**
 * Integration tests: Quota enforcement
 * Requires TEST_DATABASE_URL — skipped otherwise.
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './app.e2e-spec';
import { seedUser, seedSearch, cleanupUser } from './helpers/seed';

const TEST_CLERK_ID = 'e2e-quota-test-clerk';

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb('Quota E2E', () => {
  let app: INestApplication;
  let ds: DataSource;
  let userId: string;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    const user = await seedUser(ds, { clerk_id: TEST_CLERK_ID, email: 'e2e-quota@test.com', plan: 'free' });
    userId = user.id;
    // Seed 3 searches this month to hit the limit
    for (let i = 0; i < 3; i++) {
      await seedSearch(ds, userId, { status: 'complete' });
    }
  });

  afterAll(async () => {
    await cleanupUser(ds, TEST_CLERK_ID);
    await app.close();
  });

  it('4th search POST returns 429 for free tier user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/searches')
      .set('x-test-clerk-id', TEST_CLERK_ID)
      .send({ raw_input: 'A'.repeat(25) })
      .expect(429);

    expect(res.body.message).toContain('limit reached');
  });
});
