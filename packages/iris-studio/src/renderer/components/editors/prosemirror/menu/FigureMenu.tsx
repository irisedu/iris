import { useState } from 'react';
import {
	useEditorEffect,
	useEditorEventCallback
} from '@nytimes/react-prosemirror';
import { CommandButton, MenuBarTooltip } from './components';
import {
	useVisibilityParent,
	useVisibility,
	VisibilityContext,
	VisibilityGroup
} from '$components/VisibilityContext';
import { docSchema, setParentAttr, findParent } from 'iris-prosemirror';
import {
	Button,
	Modal,
	Dialog,
	Heading,
	TextField,
	Input
} from 'iris-components';

import FloatLeft from '~icons/tabler/float-left';
import FloatNone from '~icons/tabler/float-none';
import FloatRight from '~icons/tabler/float-right';
import Width from '~icons/tabler/viewport-wide';

function SetWidth({ index }: { index: number }) {
	const [isOpen, setIsOpen] = useState(false);
	const [visible, setVisible] = useVisibility(index);
	const [width, setWidth] = useState('');

	const updateWidth = useEditorEventCallback((view) => {
		setParentAttr(docSchema.nodes.figure, 'width', width)(
			view.state,
			view.dispatch,
			view
		);
	});

	useEditorEffect((view) => {
		if (setVisible) {
			const figure = findParent(view.state, [docSchema.nodes.figure]);
			setVisible(!!figure);
		}
	});

	return (
		<>
			<MenuBarTooltip tooltip="Set Width">
				<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
					<Dialog>
						<Heading>Set figure width</Heading>

						<TextField
							aria-label="Width (CSS)"
							value={width}
							onChange={setWidth}
						>
							<Input placeholder="Width (CSS)" />
						</TextField>

						<Button
							className="react-aria-Button border-iris-300"
							autoFocus
							onPress={() => {
								updateWidth();
								setIsOpen(false);
							}}
						>
							Apply
						</Button>
					</Dialog>
				</Modal>
				<Button
					className={`round-button${visible ? '' : ' hidden'}`}
					onPress={() => setIsOpen(true)}
					aria-label="Set Width"
				>
					<Width className="text-iris-500" />
				</Button>
			</MenuBarTooltip>
		</>
	);
}

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
				<SetWidth index={mainIdx++} />
			</VisibilityGroup>
		</VisibilityContext.Provider>
	);
}

export default FigureMenu;
