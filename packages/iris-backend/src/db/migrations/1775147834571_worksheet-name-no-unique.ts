import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('repo_worksheet')
		.dropConstraint('repo_worksheet_name_key')
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('repo_worksheet')
		.addUniqueConstraint('repo_worksheet_name_key', ['name'])
		.execute();
}
