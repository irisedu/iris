import { MenuItem, SubmenuTrigger, Popover, Menu } from 'react-aria-components';

import ChevronRight from '~icons/tabler/chevron-right';

export function SubmenuItem({ children }) {
	return (
		<MenuItem className="react-aria-MenuItem flex flex-row items-center">
			{children}
			<div className="grow" />
			<ChevronRight className="w-4 h-4" />
		</MenuItem>
	);
}

export function Submenu({ children, label }) {
	return (
		<SubmenuTrigger>
			<SubmenuItem>{label}</SubmenuItem>
			<Popover>
				<Menu aria-label={label}>{children}</Menu>
			</Popover>
		</SubmenuTrigger>
	);
}
