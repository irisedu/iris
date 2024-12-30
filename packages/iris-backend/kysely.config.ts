import { defineConfig } from 'kysely-ctl';
import { db } from './src/db/index.js';

export default defineConfig({
	kysely: db,
	migrations: {
		migrationFolder: './src/db/migrations/'
	}
});
