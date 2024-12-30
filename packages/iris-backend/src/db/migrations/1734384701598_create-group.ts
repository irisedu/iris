import { type Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.createTable('user_group')
		.addColumn('user_id', 'uuid')
		.addColumn('group_name', 'text')
		.addForeignKeyConstraint(
			'user_account_foreign',
			['user_id'],
			'user_account',
			['id']
		)
		.addPrimaryKeyConstraint('user_group_pkey', ['group_name', 'user_id'])
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('user_group').execute();
}
