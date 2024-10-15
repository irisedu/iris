// For testing purposes only.

import { findProject } from './utils.js';
import { WatchServer } from './watch.js';

(async function () {
	const { config, projectPath } = await findProject();

	const watchServer = new WatchServer(config, projectPath);
	await watchServer.start();

	watchServer.on('build', (fileInfo) => {
		console.log(
			JSON.stringify(
				fileInfo.map((fi) => fi.toJSON()),
				null,
				4
			)
		);
	});
})();
