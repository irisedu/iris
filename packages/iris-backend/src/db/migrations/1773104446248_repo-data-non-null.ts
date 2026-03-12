import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('repo_question_rev')
		.alterColumn('data', (col) => col.setNotNull())
		.execute();
	await db.schema
		.alterTable('repo_worksheet_rev')
		.alterColumn('data', (col) => col.setNotNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('repo_question_rev')
		.alterColumn('data', (col) => col.dropNotNull())
		.execute();
	await db.schema
		.alterTable('repo_worksheet_rev')
		.alterColumn('data', (col) => col.dropNotNull())
		.execute();
}
