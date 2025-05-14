import { CommandButton } from './components';
import {
	useVisibilityParent,
	VisibilityContext,
	VisibilityGroup
} from '$components/VisibilityContext';
import { docSchema, setParentAttr } from 'iris-prosemirror';

import FloatLeft from '~icons/tabler/float-left';
import FloatNone from '~icons/tabler/float-none';
import FloatRight from '~icons/tabler/float-right';

function FigureMenu({ index }: { index: number }) {
	const { childVisibility, setChildVisibility } = useVisibilityParent(index);

	let groupIdx = 0;
	let mainIdx = 0;

	return (
		<VisibilityContext.Provider value={{ childVisibility, setChildVisibility }}>
			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={mainIdx++}
					Icon={FloatLeft}
					command={setParentAttr(docSchema.nodes.figure, 'float', 'left')}
					tooltip="Float Left"
				/>
				<CommandButton
					index={mainIdx++}
					Icon={FloatNone}
					command={setParentAttr(docSchema.nodes.figure, 'float', '')}
					tooltip="No Float"
				/>
				<CommandButton
					index={mainIdx++}
					Icon={FloatRight}
					command={setParentAttr(docSchema.nodes.figure, 'float', 'right')}
					tooltip="Float Right"
				/>
			</VisibilityGroup>
		</VisibilityContext.Provider>
	);
}

export default FigureMenu;
