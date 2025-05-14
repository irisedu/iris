import { CommandButton } from './components';
import { docSchema, setParentAttr } from 'iris-prosemirror';

import FloatLeft from '~icons/tabler/float-left';
import FloatNone from '~icons/tabler/float-none';
import FloatRight from '~icons/tabler/float-right';

function FigureMenu() {
	return (
		<div className="flex flex-row gap-2">
			<CommandButton
				Icon={FloatLeft}
				command={setParentAttr(docSchema.nodes.figure, 'float', 'left')}
				tooltip="Float Left"
			/>
			<CommandButton
				Icon={FloatNone}
				command={setParentAttr(docSchema.nodes.figure, 'float', '')}
				tooltip="No Float"
			/>
			<CommandButton
				Icon={FloatRight}
				command={setParentAttr(docSchema.nodes.figure, 'float', 'right')}
				tooltip="Float Right"
			/>
		</div>
	);
}

export default FigureMenu;
