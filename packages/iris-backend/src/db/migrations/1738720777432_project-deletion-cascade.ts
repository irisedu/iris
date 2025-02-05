import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	// Deletion of project cascades to all references
	const projectRefs = [
		'project_group',
		'series',
		'document',
		'document_ptr',
		'asset_ptr'
	];

	for (const tbl of projectRefs) {
		await db.schema.alterTable(tbl).dropConstraint('project_foreign').execute();

		await db.schema
			.alterTable(tbl)
			.addForeignKeyConstraint('project_foreign', ['project_name'], 'project', [
				'name'
			])
			.onDelete('cascade')
			.execute();
	}

	// Deletion of document cascades to document pointer and question submission
	await db.schema
		.alterTable('document_ptr')
		.dropConstraint('document_foreign')
		.execute();

	await db.schema
		.alterTable('document_ptr')
		.addForeignKeyConstraint('document_foreign', ['doc_id'], 'document', ['id'])
		.onDelete('cascade')
		.execute();

	await db.schema
		.alterTable('question_submission')
		.dropConstraint('document_foreign')
		.execute();

	await db.schema
		.alterTable('question_submission')
		.addForeignKeyConstraint('document_foreign', ['question_id'], 'document', [
			'id'
		])
		.onDelete('cascade')
		.execute();
}
