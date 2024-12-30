import { type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('project')
		.addColumn('name', 'text', (col) => col.primaryKey())
		.execute();

	await db.schema
		.createTable('project_group')
		.addColumn('project_name', 'text')
		.addColumn('user_id', 'uuid')
		.addColumn('group_name', 'text')
		.addForeignKeyConstraint('project_foreign', ['project_name'], 'project', [
			'name'
		])
		.addForeignKeyConstraint(
			'user_account_foreign',
			['user_id'],
			'user_account',
			['id']
		)
		.addPrimaryKeyConstraint('project_group_pkey', [
			'project_name',
			'user_id',
			'group_name'
		])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('project_group').execute();
	await db.schema.dropTable('project').execute();
}
