import os from 'os';
import path from 'path';

export const buildDir =
	process.env.BUILD_DIR || path.join(os.tmpdir(), 'latexer');
