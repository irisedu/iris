import { Migrator, FileMigrationProvider } from 'kysely';
import { db } from './index.js';
import { promises as fs } from 'fs';
import path from 'path';

export async function migrateToLatest() {
	const migrator = new Migrator({
		db,
		provider: new FileMigrationProvider({
			fs,
			path,
			migrationFolder: path.join(import.meta.dirname, 'migrations')
		})
	});

	return await migrator.migrateToLatest();
}
