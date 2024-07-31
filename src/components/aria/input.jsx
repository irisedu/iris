import {
	Select,
	Label,
	Button,
	SelectValue,
	Popover,
	ListBox
} from 'react-aria-components';

import ChevronDown from '~icons/tabler/chevron-down';

export function Dropdown({ label, children, ...props }) {
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
