import { Button, Heading, type HeadingProps } from 'react-aria-components';

import CaretRight from '~icons/tabler/caret-right-filled';

export function DisclosureHeader({
	children,
	className,
	...props
}: HeadingProps) {
	return (
		<Heading {...props} className={`my-0 ${className ?? ''} -ml-7`}>
			<Button
				slot="trigger"
				className="group cursor-pointer pr-3 flex items-center gap-1"
			>
				<CaretRight className="disclosure-icon text-iris-900 inline-block w-5 h-5" />
				<span className="p-1 rounded-md group-data-[hovered]:bg-iris-100">
					{children}
				</span>
			</Button>
		</Heading>
	);
}
