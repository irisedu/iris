import { type Kysely, sql } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await sql`CREATE EXTENSION citext;`.execute(db);

	// https://dba.stackexchange.com/a/165923
	await sql`CREATE DOMAIN email AS citext CHECK (value ~ '^[a-zA-Z0-9.!#$%&''*+/=?^_\`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$');`.execute(
		db
	);

	await db.schema
		.createTable('user_account')
		.addColumn('id', 'uuid', (col) =>
			col.primaryKey().defaultTo(sql`gen_random_uuid()`)
		)
		.addColumn('created', 'timestamp', (col) =>
			col.notNull().defaultTo(sql`(timezone('utc', now()))`)
		)
		.addColumn('email', sql`email`, (col) => col.notNull().unique())
		.addColumn('given_name', 'varchar')
		.addColumn('family_name', 'text')
		.execute();

	await db.schema
		.createTable('user_federated_identity')
		.addColumn('id', 'serial', (col) => col.primaryKey())
		.addColumn('created', 'timestamp', (col) =>
			col.notNull().defaultTo(sql`(timezone('utc', now()))`)
		)
		.addColumn('user_id', 'uuid', (col) => col.notNull())
		.addForeignKeyConstraint(
			'user_account_foreign',
			['user_id'],
			'user_account',
			['id']
		)
		.addColumn('provider', 'text', (col) => col.notNull())
		.addColumn('federated_id', 'text', (col) => col.notNull())
		.execute();
}

export async function down(db: Kysely<any>): Promise<void> {
	await db.schema.dropTable('user_federated_identity').execute();
	await db.schema.dropTable('user_account').execute();

	await sql`DROP DOMAIN email;`.execute(db);
	await sql`DROP EXTENSION citext;`.execute(db);
}
