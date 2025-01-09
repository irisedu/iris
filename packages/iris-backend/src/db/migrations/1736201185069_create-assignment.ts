import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('assignment')
		.addColumn('external_id', 'uuid', (col) => col.notNull())
		.addColumn('user_id', 'uuid', (col) => col.notNull())
		.addPrimaryKeyConstraint('assignment_id', ['external_id', 'user_id'])
		.addForeignKeyConstraint(
			'user_account_foreign',
			['user_id'],
			'user_account',
			['id']
		)
		.addColumn('data', 'jsonb', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('assignment_submission')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('created', 'timestamp', (col) =>
			col.notNull().defaultTo(sql`(timezone('utc', now()))`)
		)
		.addColumn('external_id', 'uuid', (col) => col.notNull())
		.addColumn('user_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'user_account_foreign',
			['user_id'],
			'user_account',
			['id']
		)
		.addForeignKeyConstraint(
			'assignment_foreign',
			['external_id', 'user_id'],
			'assignment',
			['external_id', 'user_id']
		)
		.addColumn('submission', 'jsonb', (col) => col.notNull())
		.addColumn('outcome', 'jsonb')
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('assignment_submission').execute();
	await db.schema.dropTable('assignment').execute();
}
