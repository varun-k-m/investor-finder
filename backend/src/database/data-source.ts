import 'dotenv/config';
import { DataSource } from 'typeorm';

/**
 * Standalone DataSource for TypeORM CLI (migration:generate, migration:run, migration:revert).
 * Uses DATABASE_URL from .env via dotenv/config.
 *
 * NOTE: Use the Supabase DIRECT connection URL (port 5432) here, NOT the pooling URL (port 6543).
 * PgBouncer (port 6543) does not support all migration operations.
 * [Source: docs/architecture.md#Section 4 dev notes]
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  synchronize: false, // NEVER true — migrations only [Source: arch §3]
  logging: true,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});
