import { ToggleMarkButton } from './components';
import { docSchema } from 'iris-prosemirror';

import Strikethrough from '~icons/tabler/strikethrough';
import Subscript from '~icons/tabler/subscript';
import Superscript from '~icons/tabler/superscript';
import SmallCaps from '~icons/tabler/letter-a-small';

function FormattingMenu() {
	return (
		<div className="flex flex-row gap-2">
			<ToggleMarkButton
				Icon={Strikethrough}
				markType={docSchema.marks.strikethrough}
				tooltip="Strikethrough"
				keys={['Shift', 'Alt', '5']}
			/>
			<ToggleMarkButton
				Icon={SmallCaps}
				markType={docSchema.marks.small_caps}
				tooltip="Small Caps"
			/>
			<ToggleMarkButton
				Icon={Subscript}
				markType={docSchema.marks.subscript}
				tooltip="Subscript"
				keys={['Mod', ',']}
			/>
			<ToggleMarkButton
				Icon={Superscript}
				markType={docSchema.marks.superscript}
				tooltip="Superscript"
				keys={['Mod', '.']}
			/>
		</div>
	);
}

export default FormattingMenu;
