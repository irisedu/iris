import type { Kysely } from 'kysely';

// CATASTROPHIC!
export async function up(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('asset_ptr').execute();

	await db.schema.alterTable('asset').dropConstraint('asset_pkey').execute();

	await db.schema.alterTable('asset').dropColumn('id').execute();

	await db.schema.alterTable('asset').renameColumn('hash', 'id').execute();

	await db.schema
		.alterTable('asset')
		.addPrimaryKeyConstraint('asset_pkey', ['id'])
		.execute();

	await db.schema
		.createTable('asset_ptr')
		.addColumn('path', 'text')
		.addColumn('rev', 'text', (col) => col.notNull().defaultTo('latest'))
		.addPrimaryKeyConstraint('asset_ptr_pkey', ['path', 'rev'])
		.addColumn('asset_id', 'text', (col) => col.notNull())
		.addForeignKeyConstraint('asset_foreign', ['asset_id'], 'asset', ['id'])
		.addColumn('project_name', 'text')
		.execute();

	await db.schema
		.alterTable('asset_ptr')
		.addForeignKeyConstraint('project_foreign', ['project_name'], 'project', [
			'name'
		])
		.onDelete('cascade')
		.execute();

	await db.schema.alterTable('document').dropColumn('path').execute();

	await db.schema.alterTable('asset').dropColumn('path').execute();
}
