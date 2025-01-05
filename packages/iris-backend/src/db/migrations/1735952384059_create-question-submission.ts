import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('question_submission')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('created', 'timestamp', (col) =>
			col.notNull().defaultTo(sql`(timezone('utc', now()))`)
		)
		.addColumn('user_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'user_account_foreign',
			['user_id'],
			'user_account',
			['id']
		)
		.addColumn('question_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint('document_foreign', ['question_id'], 'document', [
			'id'
		])
		.addColumn('submission', 'jsonb', (col) => col.notNull())
		.addColumn('outcome', 'jsonb')
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('question_submission').execute();
}
