// For testing purposes only.

import { findProject } from './utils';
import build from './build';
import watch from './watch';

(async function () {
	const { config, projectPath } = await findProject();

	await build(config, projectPath);
	watch(config, projectPath);
})();
