import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('document')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('path', 'text', (col) => col.notNull())
		.addColumn('rev', 'text', (col) => col.notNull())
		.addColumn('data', 'jsonb', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('document_ptr')
		.addColumn('path', 'text', (col) => col.primaryKey())
		.addColumn('doc_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint('document_foreign', ['doc_id'], 'document', ['id'])
		.execute();

	await db.schema
		.createTable('asset')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('path', 'text', (col) => col.notNull())
		.addColumn('rev', 'text', (col) => col.notNull())
		.addColumn('hash', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('asset_ptr')
		.addColumn('path', 'text', (col) => col.primaryKey())
		.addColumn('asset_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint('asset_foreign', ['asset_id'], 'asset', ['id'])
		.execute();

	await db.schema.alterTable('project').addColumn('rev', 'text').execute();

	await db.schema
		.createTable('series')
		.addColumn('href', 'text', (col) => col.primaryKey())
		.addColumn('project_name', 'text', (col) => col.notNull())
		.addForeignKeyConstraint('project_foreign', ['project_name'], 'project', [
			'name'
		])
		.addColumn('data', 'jsonb', (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('document_ptr').execute();
	await db.schema.dropTable('document').execute();

	await db.schema.dropTable('asset_ptr').execute();
	await db.schema.dropTable('asset').execute();

	await db.schema.alterTable('project').dropColumn('rev').execute();

	await db.schema.dropTable('series').execute();
}
