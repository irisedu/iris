import { useSelector } from 'react-redux';
import type { RootState } from '$state/store';

import './DevAlert.css';

const devStates: Record<string, [string, string]> = {
	disconnected: ['Disconnected', 'bg-gray-500'],
	error: ['Error', 'bg-red-500'],
	connecting: ['Connecting...', 'bg-yellow-500'],
	connected: ['Connected', 'bg-green-500']
};

function DevAlert({ className }: { className?: string }) {
	const devEnabled = useSelector((state: RootState) => state.dev.enabled);
	const devHost = useSelector((state: RootState) => state.dev.host);
	const devState = useSelector((state: RootState) => state.dev.state);

	return (
		devEnabled && (
			<div
				className={`dev-alert relative font-sans text-sm border-2 border-red-200 p-2 ${className ?? ''}`}
			>
				<p className="my-0 text-red-600">
					<strong>Preview mode is enabled.</strong>
				</p>
				<p className="my-0">
					Host: <code>{devHost}</code>
				</p>
				<div className="flex flex-row items-center gap-2">
					<div className={`w-2 h-2 rounded-full ${devStates[devState][1]}`} />
					<span>{devStates[devState][0]}</span>
				</div>
			</div>
		)
	);
}

export default DevAlert;
