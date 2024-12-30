import { type ReactNode } from 'react';
import {
	MenuItem,
	SubmenuTrigger,
	Popover,
	Menu as AriaMenu,
	type MenuProps
} from 'react-aria-components';
import { createHideableComponent } from '@react-aria/collections';

import ChevronRight from '~icons/tabler/chevron-right';

// https://github.com/adobe/react-spectrum/issues/6885
export const Menu = createHideableComponent(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	({ children, ...props }: MenuProps<any>) => (
		<AriaMenu {...props}>{children}</AriaMenu>
	)
);

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
