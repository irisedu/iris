import { type ReactNode } from 'react';

import Incomplete from '~icons/tabler/circle';
import Done from '~icons/tabler/circle-check';
import InProgress from '~icons/tabler/progress-check';

function ProgressIndicator({ status }: { status: string }) {
	switch (status) {
		case 'incomplete':
			return <Incomplete className="text-zinc-500" aria-label="Incomplete" />;
		case 'done':
			return <Done className="text-green-700" aria-label="Done" />;
		case 'progress':
			return (
				<InProgress className="text-orange-700" aria-label="In Progress" />
			);
	}
}

export interface ActivityProps {
	title: string;
	unsaved?: boolean;
	status?: string;
	children: ReactNode;
}

function Activity({ title, unsaved, status, children }: ActivityProps) {
	return (
		<div className="my-3">
			<div className="flex gap-2 items-center px-2 py-1 bg-iris-200 border-2 border-iris-400 rounded-t-md">
				<span className="font-bold text-lg">{title}</span>
				{unsaved && (
					<span className="text-sm text-red-800">*unsaved changes</span>
				)}

				<div className="grow" />

				{status && <ProgressIndicator status={status} />}
			</div>
			<div className=" border-2 border-t-0 border-iris-400 p-2 rounded-b-md">
				{children}
			</div>
		</div>
	);
}

export default Activity;
