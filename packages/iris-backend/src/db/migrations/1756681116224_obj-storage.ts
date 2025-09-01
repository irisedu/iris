import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await sql`CREATE EXTENSION btree_gist;`.execute(db);

	await db.schema
		.alterTable('question_submission')
		.dropConstraint('document_foreign')
		.execute();

	await db.schema.dropTable('document_ptr').execute();
	await db.schema.dropTable('document').execute();
	await db.schema.dropTable('asset_ptr').execute();
	await db.schema.dropTable('asset').execute();

	await db.schema
		.createTable('document')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('project_name', 'text', (col) => col.notNull())
		.addForeignKeyConstraint(
			'project_foreign',
			['project_name'],
			'project',
			['name'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('hash', 'text', (col) => col.notNull())
		.addUniqueConstraint('document_unique', ['project_name', 'hash'])
		.addColumn('data', 'jsonb', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('document_ptr')
		.addColumn('project_name', 'text', (col) => col.notNull())
		.addForeignKeyConstraint(
			'project_foreign',
			['project_name'],
			'project',
			['name'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('path', 'text', (col) => col.notNull())
		.addColumn('rev', 'text', (col) => col.notNull())
		.addPrimaryKeyConstraint('document_ptr_pkey', ['path', 'rev'])
		.addColumn('doc_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint('document_foreign', ['doc_id'], 'document', ['id'])
		.execute();

	await sql`ALTER TABLE document_ptr ADD CONSTRAINT document_project_path_exclude EXCLUDE USING gist (path WITH =, project_name WITH <>);`.execute(
		db
	);

	await db.schema
		.createTable('asset_ptr')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('project_name', 'text', (col) => col.notNull())
		.addForeignKeyConstraint(
			'project_foreign',
			['project_name'],
			'project',
			['name'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('path', 'text', (col) => col.notNull())
		.addColumn('rev', 'text', (col) => col.notNull())
		.addUniqueConstraint('asset_ptr_unique', ['project_name', 'path', 'rev'])
		.addColumn('hash', 'text', (col) => col.notNull())
		.execute();

	await sql`ALTER TABLE asset_ptr ADD CONSTRAINT asset_ptr_project_path_exclude EXCLUDE USING gist (path WITH =, project_name WITH <>);`.execute(
		db
	);

	await db.schema
		.alterTable('question_submission')
		.addForeignKeyConstraint('document_foreign', ['question_id'], 'document', [
			'id'
		])
		.onDelete('cascade')
		.execute();

	await db.schema
		.createTable('project_rev')
		.addColumn('project_name', 'text', (col) => col.notNull())
		.addForeignKeyConstraint(
			'project_foreign',
			['project_name'],
			'project',
			['name'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('rev', 'text', (col) => col.notNull())
		.addColumn('hash', 'text', (col) => col.notNull())
		.execute();

	await db.schema.dropTable('series').execute();

	await db.schema
		.createTable('series')
		.addColumn('path', 'text', (col) => col.notNull())
		.addColumn('project_name', 'text', (col) => col.notNull())
		.addForeignKeyConstraint(
			'project_foreign',
			['project_name'],
			'project',
			['name'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('rev', 'text', (col) => col.notNull())
		.addPrimaryKeyConstraint('series_pkey', ['project_name', 'path', 'rev'])
		.addColumn('data', 'jsonb', (col) => col.notNull())
		.execute();

	await sql`ALTER TABLE series ADD CONSTRAINT series_project_path_exclude EXCLUDE USING gist (path WITH =, project_name WITH <>);`.execute(
		db
	);
}
