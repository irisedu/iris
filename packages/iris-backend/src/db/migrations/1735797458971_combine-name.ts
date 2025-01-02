import type { Kysely } from 'kysely';

export async function up(db: Kysely<any>): Promise<void> {
	await db.schema
		.alterTable('user_account')
		.addColumn('name', 'text')
		.dropColumn('family_name')
		.dropColumn('given_name')
		.execute();
}
