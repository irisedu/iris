import {
	useEditorEffect,
	useEditorEventCallback
} from '@nytimes/react-prosemirror';
import {
	useVisibility,
	useVisibilityParent,
	VisibilityContext,
	VisibilityGroup,
	MenuTrigger,
	Button,
	Popover,
	Menu,
	MenuItem
} from 'iris-components';
import {
	docSchema,
	insertNode,
	tableComponent,
	noteComponent
} from 'iris-prosemirror';
import { CommandButton, MenuBarTooltip } from './components';

import Space from '~icons/tabler/space';
import Table from '~icons/tabler/table-plus';
import Image from '~icons/tabler/photo';
import Info from '~icons/tabler/info-circle';
import Question from '~icons/tabler/question-mark';
import LLM from '~icons/tabler/sparkles';

function NoteMenu({ index }: { index: number }) {
	const [visible, setVisible] = useVisibility(index);

	const insertNote = useEditorEventCallback((view, noteType: string) => {
		noteComponent.commands.insertNote(noteType)(
			view.state,
			view.dispatch,
			view
		);
		view.focus();
	});

	useEditorEffect((view) => {
		if (setVisible)
			setVisible(
				noteComponent.commands.insertNote('info')(view.state, undefined, view)
			);
	});

	return (
		<MenuTrigger>
			<MenuBarTooltip tooltip="Note">
				<Button
					className={`round-button${visible ? '' : ' hidden'}`}
					aria-label="Text Style"
				>
					<Info className="text-iris-500" />
				</Button>
			</MenuBarTooltip>

			<Popover>
				<Menu>
					<MenuItem onAction={() => insertNote('info')}>Info</MenuItem>
					<MenuItem onAction={() => insertNote('warning')}>Warning</MenuItem>
					<MenuItem onAction={() => insertNote('tip')}>Tip</MenuItem>
					<MenuItem onAction={() => insertNote('problem')}>Problem</MenuItem>
					<MenuItem onAction={() => insertNote('exercise')}>Exercise</MenuItem>
				</Menu>
			</Popover>
		</MenuTrigger>
	);
}

function InsertMenu({
	index,
	setCurrentTab
}: {
	index: number;
	setCurrentTab: (tab: string) => void;
}) {
	const { childVisibility, setChildVisibility } = useVisibilityParent(index);

	let groupIdx = 0;
	let mainIdx = 0;

	return (
		<VisibilityContext.Provider value={{ childVisibility, setChildVisibility }}>
			<VisibilityGroup index={groupIdx++} className="flex flex-row gap-2">
				<CommandButton
					index={mainIdx++}
					Icon={() => <span className="text-iris-500 text-xl">—</span>}
					command={insertNode(docSchema.nodes.horizontal_rule)}
					tooltip="Horizontal Rule"
				/>
				<CommandButton
					index={mainIdx++}
					Icon={Space}
					command={insertNode(docSchema.nodes.nbsp)}
					tooltip="Non-breaking Space"
					keys={['Mod', 'Space']}
				/>
				<CommandButton
					index={mainIdx++}
					Icon={Table}
					command={(state, dispatch) => {
						if (dispatch) setTimeout(() => setCurrentTab('table'), 80);

						return tableComponent.commands.addTable({
							rowsCount: 2,
							colsCount: 2,
							withHeaderRow: true
						})(state, dispatch);
					}}
					tooltip="Table"
				/>
				<CommandButton
					index={mainIdx++}
					Icon={Image}
					command={insertNode(docSchema.nodes.figure, () =>
						docSchema.nodes.image.create()
					)}
					tooltip="Image"
				/>
				<NoteMenu index={mainIdx++} />
				<CommandButton
					index={mainIdx++}
					Icon={Question}
					command={insertNode(docSchema.nodes.question)}
					tooltip="Interactive Question"
				/>
				<CommandButton
					index={mainIdx++}
					Icon={LLM}
					command={insertNode(docSchema.nodes.hint_prompt, undefined, () => ({
						id: crypto.randomUUID()
					}))}
					tooltip="Hint Prompt"
				/>
			</VisibilityGroup>
		</VisibilityContext.Provider>
	);
}

export default InsertMenu;
