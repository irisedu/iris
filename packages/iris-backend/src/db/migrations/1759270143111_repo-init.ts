import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('repo_workspace')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('name', 'text', (col) => col.notNull().unique())
		.addColumn('preview_template_id', 'uuid')
		.execute();

	await db.schema
		.createTable('repo_workspace_group')
		.addColumn('workspace_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_workspace_foreign',
			['workspace_id'],
			'repo_workspace',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('user_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'user_account_foreign',
			['user_id'],
			'user_account',
			['id']
		)
		.addColumn('group_name', 'text')
		.addPrimaryKeyConstraint('repo_workspace_group_pkey', [
			'workspace_id',
			'user_id'
		])
		.execute();

	await db.schema
		.createTable('repo_question')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('num', 'bigserial', (col) => col.notNull())
		.addColumn('workspace_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_workspace_foreign',
			['workspace_id'],
			'repo_workspace',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('creator', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'user_account_foreign',
			['creator'],
			'user_account',
			['id']
		)
		.addColumn('created', 'timestamp', (col) =>
			col.notNull().defaultTo(sql`(timezone('utc', now()))`)
		)
		.addColumn('type', 'text', (col) => col.notNull())
		.addColumn('comment', 'text')
		.addColumn('privilege', 'int2', (col) => col.notNull().defaultTo(0))
		.addColumn('deleted', 'boolean', (col) => col.notNull().defaultTo(false))
		.execute();

	await db.schema
		.createTable('repo_question_rev')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('creator', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'user_account_foreign',
			['creator'],
			'user_account',
			['id']
		)
		.addColumn('created', 'timestamp', (col) =>
			col.notNull().defaultTo(sql`(timezone('utc', now()))`)
		)
		.addColumn('question_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_question_1_foreign',
			['question_id'],
			'repo_question',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('derived_from', 'uuid')
		.addForeignKeyConstraint(
			'repo_question_2_foreign',
			['derived_from'],
			'repo_question',
			['id']
		)
		.addColumn('data', 'jsonb')
		.execute();

	await db.schema
		.createTable('repo_tag')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('workspace_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_workspace_foreign',
			['workspace_id'],
			'repo_workspace',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('name', 'text', (col) => col.notNull())
		.execute();

	await db.schema
		.createTable('repo_question_tag')
		.addColumn('question_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_question_foreign',
			['question_id'],
			'repo_question',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('tag_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_tag_foreign',
			['tag_id'],
			'repo_tag',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addPrimaryKeyConstraint('repo_question_tag_pkey', [
			'question_id',
			'tag_id'
		])
		.execute();

	await db.schema
		.createTable('repo_template')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('workspace_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_workspace_foreign',
			['workspace_id'],
			'repo_workspace',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('name', 'text', (col) => col.notNull().unique())
		.addColumn('hash', 'text')
		.execute();

	await db.schema
		.alterTable('repo_workspace')
		.addForeignKeyConstraint(
			'repo_template_foreign',
			['preview_template_id'],
			'repo_template',
			['id']
		)
		.execute();

	await db.schema
		.createTable('repo_worksheet')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('name', 'text', (col) => col.notNull().unique())
		.addColumn('workspace_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_workspace_foreign',
			['workspace_id'],
			'repo_workspace',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('creator', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'user_account_foreign',
			['creator'],
			'user_account',
			['id']
		)
		.addColumn('created', 'timestamp', (col) =>
			col.notNull().defaultTo(sql`(timezone('utc', now()))`)
		)
		.addColumn('template_id', 'uuid')
		.addForeignKeyConstraint(
			'repo_template_foreign',
			['template_id'],
			'repo_template',
			['id']
		)
		.addColumn('privilege', 'int2', (col) => col.notNull().defaultTo(0))
		.execute();

	await db.schema
		.createTable('repo_worksheet_rev')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('creator', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'user_account_foreign',
			['creator'],
			'user_account',
			['id']
		)
		.addColumn('created', 'timestamp', (col) =>
			col.notNull().defaultTo(sql`(timezone('utc', now()))`)
		)
		.addColumn('worksheet_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'repo_worksheet_foreign',
			['worksheet_id'],
			'repo_worksheet',
			['id'],
			(fk) => fk.onDelete('cascade')
		)
		.addColumn('data', 'jsonb')
		.execute();

	await db.schema
		.alterTable('project_group')
		.dropConstraint('project_group_pkey')
		.execute();
	await db.schema
		.alterTable('project_group')
		.addPrimaryKeyConstraint('project_group_pkey', ['project_name', 'user_id'])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('repo_worksheet_rev').execute();
	await db.schema.dropTable('repo_worksheet').execute();
	await db.schema
		.alterTable('repo_workspace')
		.dropConstraint('repo_template_foreign')
		.execute();
	await db.schema.dropTable('repo_template').execute();
	await db.schema.dropTable('repo_question_tag').execute();
	await db.schema.dropTable('repo_tag').execute();
	await db.schema.dropTable('repo_question_rev').execute();
	await db.schema.dropTable('repo_question').execute();
	await db.schema.dropTable('repo_workspace_group').execute();
	await db.schema.dropTable('repo_workspace').execute();

	await db.schema
		.alterTable('project_group')
		.dropConstraint('project_group_pkey')
		.execute();
	await db.schema
		.alterTable('project_group')
		.addPrimaryKeyConstraint('project_group_pkey', [
			'project_name',
			'user_id',
			'group_name'
		])
		.execute();
}
