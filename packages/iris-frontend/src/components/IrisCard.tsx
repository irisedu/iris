import { type ReactNode } from 'react';
import irisFlower from '$assets/iris.svg';

function IrisCard({
	children,
	className
}: {
	children?: ReactNode;
	className?: string;
}) {
	return (
		<div
			className={`relative h-28 rounded-xl bg-iris-100 overflow-hidden p-4 shadow hover:shadow-md transition-shadow duration-200${className ? ' ' + className : ''}`}
		>
			<img
				src={irisFlower}
				className="iris-rotate absolute w-72 -bottom-32 -left-32 rotate-12 opacity-10 select-none z-10"
			/>

			<div className="relative z-20 h-full">{children}</div>
		</div>
	);
}

export default IrisCard;
