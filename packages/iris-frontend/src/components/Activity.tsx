import { type ReactNode } from 'react';

export interface ActivityProps {
	title: string;
	children: ReactNode;
}

function Activity({ title, children }: ActivityProps) {
	return (
		<div className="my-3">
			<div className="flex gap-2 px-2 py-1 bg-iris-200 border-2 border-iris-400 rounded-t-md">
				<span className="font-bold text-lg">{title}</span>
			</div>
			<div className=" border-2 border-t-0 border-iris-400 p-2 rounded-b-md">
				{children}
			</div>
		</div>
	);
}

export default Activity;
