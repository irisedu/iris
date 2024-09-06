// For testing purposes only.

import { findProject } from './utils';
import { WatchServer } from './watch';

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
