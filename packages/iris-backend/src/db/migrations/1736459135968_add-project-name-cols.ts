import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('document')
		.addColumn('project_name', 'text')
		.execute();

	await db.schema
		.alterTable('document')
		.addForeignKeyConstraint('project_foreign', ['project_name'], 'project', [
			'name'
		])
		.execute();

	await db.schema
		.alterTable('document_ptr')
		.addColumn('project_name', 'text')
		.execute();

	await db.schema
		.alterTable('document_ptr')
		.addForeignKeyConstraint('project_foreign', ['project_name'], 'project', [
			'name'
		])
		.execute();

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

	await db.schema
		.alterTable('asset_ptr')
		.addColumn('project_name', 'text')
		.execute();

	await db.schema
		.alterTable('asset_ptr')
		.addForeignKeyConstraint('project_foreign', ['project_name'], 'project', [
			'name'
		])
		.execute();

	await db.schema
		.alterTable('series')
		.alterColumn('project_name', (col) => col.dropNotNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.alterTable('document').dropColumn('project_name').execute();

	await db.schema
		.alterTable('document_ptr')
		.dropColumn('project_name')
		.execute();

	await db.schema.alterTable('asset').dropColumn('project_name').execute();
	await db.schema.alterTable('asset_ptr').dropColumn('project_name').execute();

	await db.schema
		.alterTable('series')
		.alterColumn('project_name', (col) => col.setNotNull())
		.execute();
}
