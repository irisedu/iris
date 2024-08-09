import { type ReactNode } from 'react';
import { MenuItem, SubmenuTrigger, Popover, Menu } from 'react-aria-components';

import ChevronRight from '~icons/tabler/chevron-right';

interface SubmenuItemProps {
	children: ReactNode;
}

export function SubmenuItem({ children }: SubmenuItemProps) {
	return (
		<MenuItem className="react-aria-MenuItem flex flex-row items-center">
			{children}
			<div className="grow" />
			<ChevronRight className="w-4 h-4" />
		</MenuItem>
	);
}

interface SubmenuProps {
	label: string;
	children: ReactNode;
}

export function Submenu({ children, label }: SubmenuProps) {
	return (
		<SubmenuTrigger>
			<SubmenuItem>{label}</SubmenuItem>
			<Popover>
				<Menu aria-label={label}>{children}</Menu>
			</Popover>
		</SubmenuTrigger>
	);
}
