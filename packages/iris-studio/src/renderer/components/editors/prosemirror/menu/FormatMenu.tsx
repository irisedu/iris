import { ToggleMarkButton } from './components';
import {
	useVisibilityParent,
	VisibilityContext,
	VisibilityGroup
} from '$components/VisibilityContext';
import { docSchema } from '../schema';

import Strikethrough from '~icons/tabler/strikethrough';
import Subscript from '~icons/tabler/subscript';
import Superscript from '~icons/tabler/superscript';
import SmallCaps from '~icons/tabler/letter-a-small';

function FormattingMenu({ index }: { index: number }) {
	const { childVisibility, setChildVisibility } = useVisibilityParent(index);

	let groupIdx = 0;
	let mainIdx = 0;

	return (
		<VisibilityContext.Provider value={{ childVisibility, setChildVisibility }}>
			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<ToggleMarkButton
					index={mainIdx++}
					Icon={Strikethrough}
					markType={docSchema.marks.s}
					tooltip="Strikethrough"
					keys={['Shift', 'Alt', '5']}
				/>
				<ToggleMarkButton
					index={mainIdx++}
					Icon={SmallCaps}
					markType={docSchema.marks.smallcaps}
					tooltip="Small Caps"
				/>
				<ToggleMarkButton
					index={mainIdx++}
					Icon={Subscript}
					markType={docSchema.marks.sub}
					tooltip="Subscript"
					keys={['Mod', ',']}
				/>
				<ToggleMarkButton
					index={mainIdx++}
					Icon={Superscript}
					markType={docSchema.marks.sup}
					tooltip="Superscript"
					keys={['Mod', '.']}
				/>
			</VisibilityGroup>
		</VisibilityContext.Provider>
	);
}

export default FormattingMenu;
