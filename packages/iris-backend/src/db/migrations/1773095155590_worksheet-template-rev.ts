import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('repo_worksheet')
		.dropColumn('template_id')
		.execute();

	await db.schema
		.alterTable('repo_worksheet_rev')
		.addColumn('template_id', 'uuid', (col) => col.notNull())
		.execute();

	await db.schema
		.alterTable('repo_worksheet_rev')
		.addForeignKeyConstraint(
			'repo_template_foreign',
			['template_id'],
			'repo_template',
			['id']
		)
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('repo_worksheet_rev')
		.dropColumn('template_id')
		.execute();

	await db.schema
		.alterTable('repo_worksheet')
		.addColumn('template_id', 'uuid')
		.execute();

	await db.schema
		.alterTable('repo_worksheet')
		.addForeignKeyConstraint(
			'repo_template_foreign',
			['template_id'],
			'repo_template',
			['id']
		)
		.execute();
}
