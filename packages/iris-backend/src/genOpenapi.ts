import spec from './openapi.js';
import fs from 'node:fs';
import path from 'node:path';

fs.writeFileSync(
	path.join(import.meta.dirname, 'openapi.json'),
	JSON.stringify(spec)
);
