import { Kysely, PostgresDialect } from 'kysely';
import pg from 'pg';
import type { DB } from './db.js';

// https://stackoverflow.com/a/67475315
pg.types.setTypeParser(1114, function (stringValue) {
	return stringValue;
});

export const dialect = new PostgresDialect({
	pool: new pg.Pool({
		connectionString: process.env.DATABASE_URL
	})
});

export const db = new Kysely<DB>({
	dialect
});

export type * from './db.js';
