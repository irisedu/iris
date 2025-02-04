import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('asset').dropColumn('project_name').execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('asset')
		.addColumn('project_name', 'text')
		.execute();

	await db.schema
		.alterTable('asset')
		.addForeignKeyConstraint('project_foreign', ['project_name'], 'project', [
			'name'
		])
		.execute();
}
