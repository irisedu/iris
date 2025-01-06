import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('document_ptr')
		.dropConstraint('document_ptr_pkey')
		.execute();

	await db.schema
		.alterTable('document_ptr')
		.addColumn('rev', 'text', (col) => col.notNull().defaultTo('latest'))
		.execute();

	await db.schema
		.alterTable('document_ptr')
		.addPrimaryKeyConstraint('document_ptr_pkey', ['path', 'rev'])
		.execute();

	await db.schema
		.alterTable('asset_ptr')
		.dropConstraint('asset_ptr_pkey')
		.execute();

	await db.schema
		.alterTable('asset_ptr')
		.addColumn('rev', 'text', (col) => col.notNull().defaultTo('latest'))
		.execute();

	await db.schema
		.alterTable('asset_ptr')
		.addPrimaryKeyConstraint('asset_ptr_pkey', ['path', 'rev'])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('document_ptr')
		.dropConstraint('document_ptr_pkey')
		.execute();

	await db.schema.alterTable('document_ptr').dropColumn('rev').execute();

	await db.schema
		.alterTable('document_ptr')
		.addPrimaryKeyConstraint('document_ptr_pkey', ['path'])
		.execute();

	await db.schema
		.alterTable('asset_ptr')
		.dropConstraint('asset_ptr_pkey')
		.execute();

	await db.schema.alterTable('asset_ptr').dropColumn('rev').execute();

	await db.schema
		.alterTable('asset_ptr')
		.addPrimaryKeyConstraint('asset_ptr_pkey', ['path'])
		.execute();
}
