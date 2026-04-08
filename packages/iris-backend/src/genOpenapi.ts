import spec from './openapi.js';
import fs from 'node:fs';
import path from 'node:path';
import openapiTS, { astToString, type OpenAPI3 } from 'openapi-typescript';

fs.writeFileSync(
	path.join(import.meta.dirname, 'openapi.json'),
	JSON.stringify(spec)
);

const ast = await openapiTS(spec as OpenAPI3);
fs.writeFileSync(
	path.join(import.meta.dirname, 'openapi.d.ts'),
	astToString(ast)
);
