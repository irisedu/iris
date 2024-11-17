import { type ReactNode } from 'react';
import {
	Select,
	Label,
	Button,
	SelectValue,
	Popover,
	Switch as AriaSwitch,
	ListBox,
	type SelectProps,
	type SwitchProps
} from 'react-aria-components';

import ChevronDown from '~icons/tabler/chevron-down';

interface DropdownProps<T extends object> extends SelectProps<T> {
	label: string;
}

export function Dropdown<T extends object>({
	label,
	children,
	...props
}: DropdownProps<T>) {
	return (
		<Select {...props}>
			<Label>{label}</Label>
			<Button className="react-aria-Button flex flex-row items-center">
				<SelectValue />
				<ChevronDown className="w-5 h-5 ml-2 text-iris-500" />
			</Button>
			<Popover>
				<ListBox>{children}</ListBox>
			</Popover>
		</Select>
	);
}

export function Switch({
	children,
	...props
}: SwitchProps & { children: ReactNode }) {
	return (
		<AriaSwitch {...props}>
			<div className="indicator" />
			{children}
		</AriaSwitch>
	);
}
