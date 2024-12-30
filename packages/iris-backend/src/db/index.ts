import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { DB } from './db.js';

export const dialect = new PostgresDialect({
	pool: new pg.Pool({
		connectionString: process.env.DATABASE_URL
	})
});

export const db = new Kysely<DB>({
	dialect
});

export type * from './db.js';
