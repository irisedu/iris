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
	Input,
	Label,
	TextArea
} from 'iris-components';

import FloatLeft from '~icons/tabler/float-left';
import FloatNone from '~icons/tabler/float-none';
import FloatRight from '~icons/tabler/float-right';
import Edit from '~icons/tabler/edit';

function EditButton({ index }: { index: number }) {
	const [isOpen, setIsOpen] = useState(false);
	const [visible, setVisible] = useVisibility(index);
	const [figure, setFigure] = useState<number | null>(null);

	const [width, setWidth] = useState('');

	const [image, setImage] = useState<number | null>(null);
	const [imgSrc, setImgSrc] = useState('');
	const [imgAlt, setImgAlt] = useState('');

	const updateFigure = useEditorEventCallback((view) => {
		if (!figure) return;
		const tr = view.state.tr;

		tr.setNodeAttribute(figure, 'width', width);

		if (image !== null) {
			tr.setNodeAttribute(image, 'src', imgSrc).setNodeAttribute(
				image,
				'alt',
				imgAlt
			);
		}

		view.dispatch(tr);
	});

	useEditorEffect((view) => {
		const newFigure = findParent(view.state, [docSchema.nodes.figure]);
		if (!newFigure) {
			setFigure(null);
			setImage(null);

			if (setVisible) setVisible(false);
			return;
		}

		const node = view.state.doc.nodeAt(newFigure.before);
		if (!node) return;
		if (setVisible) setVisible(true);

		if (newFigure.before !== figure) {
			setFigure(newFigure.before);

			setWidth(node.attrs.width ?? '');

			// Reset
			setImage(null);

			node.forEach((child, offset) => {
				if (child.type === view.state.schema.nodes.image) {
					setImage(newFigure.before + 1 + offset);
					setImgSrc(child.attrs.src ?? '');
					setImgAlt(child.attrs.alt ?? '');
				}

				return false;
			});
		}
	});

	return (
		<>
			<MenuBarTooltip tooltip="Edit Figure">
				<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
					<Dialog>
						<Heading slot="title">Edit figure</Heading>

						<TextField value={width} onChange={setWidth}>
							<Label>Width (e.g., 90%)</Label>
							<Input />
						</TextField>

						{image !== null && (
							<>
								<TextField value={imgSrc} onChange={setImgSrc}>
									<Label>Image source</Label>
									<Input />
								</TextField>
								<TextField value={imgAlt} onChange={setImgAlt}>
									<Label>Image alt text</Label>
									<TextArea />
								</TextField>
							</>
						)}

						<Button
							className="react-aria-Button border-iris-300"
							autoFocus
							onPress={() => {
								updateFigure();
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
					aria-label="Edit Figure"
				>
					<Edit className="text-iris-500" />
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
				<EditButton index={mainIdx++} />
			</VisibilityGroup>
		</VisibilityContext.Provider>
	);
}

export default FigureMenu;
