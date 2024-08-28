// For testing purposes only.

import { findProject } from './utils';
import build from './build';
import watch from './watch';

(async function () {
	const { config, projectPath } = await findProject();

	const fileInfo = await build(config, projectPath);
	console.log(
		JSON.stringify(
			fileInfo.map((fi) => fi.toJSON()),
			null,
			4
		)
	);

	watch(config, projectPath);
})();
