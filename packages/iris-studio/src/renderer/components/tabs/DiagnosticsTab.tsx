import { useState, useEffect } from 'react';
import { Link } from 'react-aria-components';
import type { TabData, TabRender } from '$state/tabsSlice';

import Bug from '~icons/tabler/bug';

function DiagnosticsTab() {
	const [version, setVersion] = useState('...');

	useEffect(() => {
		app.getVersion().then(setVersion);
	}, []);

	return (
		<div className="m-2 font-sans">
			<h1>Experiencing issues?</h1>
			<p>
				Contact the Iris maintainers at{' '}
				<Link
					onPress={() => window.open('mailto:contact@seki.pw')}
					className="react-aria-Link external"
					target="_blank"
				>
					contact@seki.pw
				</Link>{' '}
				or report an issue on{' '}
				<Link
					onPress={() => window.open('https://github.com/irisedu/studio')}
					className="react-aria-Link external"
					target="_blank"
				>
					GitHub
				</Link>{' '}
				with the details in this tab.
			</p>

			<dl>
				<dt>Version</dt>
				<dd>{version}</dd>

				<dt>Electron Version</dt>
				<dd>{process.versions.electron}</dd>

				<dt>Chrome Version</dt>
				<dd>{process.versions.chrome}</dd>

				<dt>Architecture</dt>
				<dd>{process.arch}</dd>

				<dt>Platform</dt>
				<dd>
					{os.platform} {os.release}
				</dd>
			</dl>
		</div>
	);
}

export const data: TabData = { id: 'studio-diagnostics', type: 'normal' };
export const tab: TabRender = {
	id: data.id,
	title: 'Diagnostics',
	icon: <Bug className="text-iris-500 w-5 h-5" />,
	view: <DiagnosticsTab />
};
