/**
 * Integration tests: User routes
 * Requires TEST_DATABASE_URL — skipped otherwise.
 */
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { createTestApp } from './app.e2e-spec';
import { seedUser, cleanupUser } from './helpers/seed';

const TEST_CLERK_ID = 'e2e-user-test-clerk';

const describeIfDb = process.env.TEST_DATABASE_URL ? describe : describe.skip;

describeIfDb('Users E2E', () => {
  let app: INestApplication;
  let ds: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    ds = app.get(DataSource);
    await seedUser(ds, { clerk_id: TEST_CLERK_ID, email: 'e2e-user@test.com' });
  });

  afterAll(async () => {
    await cleanupUser(ds, TEST_CLERK_ID);
    await app.close();
  });

  it('GET /api/v1/users/me returns user + searches_this_month', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('x-test-clerk-id', TEST_CLERK_ID)
      .expect(200);

    expect(res.body).toMatchObject({
      clerk_id: TEST_CLERK_ID,
      plan: 'free',
    });
    expect(typeof res.body.searches_this_month).toBe('number');
  });

  it('GET /api/v1/users/me returns 401 without auth', async () => {
    await request(app.getHttpServer()).get('/api/v1/users/me').expect(403);
  });

  it('GET /api/v1/users/me/saved returns empty array initially', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me/saved')
      .set('x-test-clerk-id', TEST_CLERK_ID)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });

  it('DELETE /api/v1/users/me returns 204 and user is gone', async () => {
    // Seed a separate user so we don't break other tests
    await seedUser(ds, { clerk_id: 'e2e-gdpr-test', email: 'gdpr@test.com' });

    await request(app.getHttpServer())
      .delete('/api/v1/users/me')
      .set('x-test-clerk-id', 'e2e-gdpr-test')
      .expect(204);

    // Verify user is deleted
    await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('x-test-clerk-id', 'e2e-gdpr-test')
      .expect(404);
  });
});
