import { useEffect, useState, useCallback } from 'react';
import { Button, TooltipTrigger, Tooltip } from 'iris-components';
import type { FileInfo } from 'patchouli';

import Play from '~icons/tabler/player-play-filled';
import Stop from '~icons/tabler/player-stop-filled';
import Check from '~icons/tabler/check';
import Exclaim from '~icons/tabler/exclamation-mark';
import Error from '~icons/tabler/exclamation-circle';

function WatchServerStatus({ status }: { status: string }) {
	switch (status) {
		case 'success':
			return (
				<span title="Build successful">
					<Check className="w-5 h-5 text-green-600 m-1.5" />
				</span>
			);
		case 'warn':
			return (
				<span title="Build completed with errors">
					<Exclaim className="w-5 h-5 text-yellow-600 m-1.5" />
				</span>
			);
		case 'errored':
			return (
				<span title="Build errored">
					<Error className="w-5 h-5 text-red-600 m-1.5" />
				</span>
			);
	}
}

function WatchServerWidget() {
	const [watchServerOpen, setWatchServerOpen] = useState(false);
	const [watchServerStatus, setWatchServerStatus] = useState('stopped');

	const updateStatus = useCallback(() => {
		patchouli.getServerStatus().then((status) => {
			setWatchServerOpen(status?.isOpen);

			if (!status?.isOpen) {
				setWatchServerStatus('stopped');
			}
		});
	}, []);

	useEffect(() => {
		const interval = setInterval(updateStatus, 1000);

		const buildOff = app.on(
			'patchouli:build',
			(results: ReturnType<FileInfo['toJSON']>[]) => {
				setWatchServerStatus(
					results.some((r) => r.messages.length) ? 'warn' : 'success'
				);
			}
		);

		const buildErrorOff = app.on('patchouli:buildError', () => {
			setWatchServerStatus('errored');
		});

		return () => {
			clearInterval(interval);
			buildOff();
			buildErrorOff();
		};
	}, [updateStatus]);

	const label = watchServerOpen ? 'Stop Watch Server' : 'Start Watch Server';

	return (
		<div className="absolute right-8 bottom-8 flex flex-row items-center bg-iris-200 font-sans text-sm">
			<TooltipTrigger delay={300}>
				<Button
					aria-label={label}
					className={`w-8 h-8 ${watchServerOpen ? 'bg-red-300 data-[hovered]:bg-red-400 data-[pressed]:bg-red-500' : 'bg-green-300 data-[hovered]:bg-green-400 data-[pressed]:bg-red-500'}`}
					onPress={() => {
						patchouli.setServerIsOpen(!watchServerOpen).then(updateStatus);
					}}
				>
					{watchServerOpen ? (
						<Stop className="w-1/2 h-1/2 m-auto" />
					) : (
						<Play className="w-1/2 h-1/2 m-auto" />
					)}
				</Button>
				<Tooltip placement="top">{label}</Tooltip>
			</TooltipTrigger>

			<WatchServerStatus status={watchServerStatus} />
		</div>
	);
}

export default WatchServerWidget;
