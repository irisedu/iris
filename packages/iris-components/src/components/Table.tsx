import { type ReactNode } from 'react';
import {
	Column as AriaColumn,
	Group,
	type ColumnProps
} from 'react-aria-components';

import CaretUp from '~icons/tabler/caret-up-filled';
import CaretDown from '~icons/tabler/caret-down-filled';

export function Column(
	props: Omit<ColumnProps, 'children'> & { children?: ReactNode }
) {
	return (
		<AriaColumn {...props} className="react-aria-Column">
			{({ allowsSorting, sortDirection }) => (
				<div className="flex items-center gap-1 font-bold">
					<Group role="presentation" tabIndex={-1}>
						{props.children}
					</Group>
					{allowsSorting && (
						<span aria-hidden="true" className="sort-indicator">
							{sortDirection === 'ascending' ? (
								<CaretUp className="w-4 h-4 text-iris-900" />
							) : (
								<CaretDown className="w-4 h-4 text-iris-900" />
							)}
						</span>
					)}
				</div>
			)}
		</AriaColumn>
	);
}
