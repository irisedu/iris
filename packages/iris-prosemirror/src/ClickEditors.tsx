import { useEffect, useState } from 'react';
import {
	useEditorEffect,
	useEditorEventCallback,
	useEditorState
} from '@handlewithcare/react-prosemirror';
import { docSchema, findParent, markExtend } from 'iris-prosemirror';
import {
	Button,
	Dialog,
	Heading,
	Input,
	Label,
	Modal,
	TextArea,
	TextField
} from 'iris-components';

export interface DialogProps {
	isOpen: boolean;
	setIsOpen: (val: boolean) => void;
}

function FigureDialog({ isOpen, setIsOpen }: DialogProps) {
	const [figure, setFigure] = useState<number | null>(null);

	const [width, setWidth] = useState('');

	const [image, setImage] = useState<number | null>(null);
	const [imgSrc, setImgSrc] = useState('');
	const [imgAlt, setImgAlt] = useState('');

	const state = useEditorState();

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

	useEditorEffect(
		(view) => {
			const newFigure = findParent(view.state, [docSchema.nodes.figure]);
			if (!newFigure) {
				setFigure(null);
				setImage(null);
				return;
			}

			const node = view.state.doc.nodeAt(newFigure.before);
			if (!node) return;

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
		},
		[state]
	);

	return (
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
	);
}

function LinkDialog({ isOpen, setIsOpen }: DialogProps) {
	const [link, setLink] = useState<number | null>(null);
	const [linkEnd, setLinkEnd] = useState<number | null>(null);

	const [target, setTarget] = useState('');

	const state = useEditorState();

	const updateLinkMark = useEditorEventCallback((view) => {
		if (!link || !linkEnd) return;

		const state = view.state;
		const schema = state.schema;

		const node = state.doc.nodeAt(link);
		if (!node) return;

		view.dispatch(
			state.tr
				.removeMark(link, linkEnd, schema.marks.link)
				.addMark(link, linkEnd, schema.marks.link.create({ href: target }))
		);
	});

	useEditorEffect(
		(view) => {
			const state = view.state;
			const schema = state.schema;
			const { $from, $to } = state.selection;

			setLink(null);

			const res = markExtend($from, $to, schema.marks.link);

			if (res) {
				const { from, to, mark } = res;

				if (from !== link) {
					setTarget(mark.attrs.href);
				}

				setLink(from);
				setLinkEnd(to);
			}
		},
		[state]
	);

	return (
		<Modal isDismissable isOpen={isOpen} onOpenChange={setIsOpen}>
			<Dialog>
				<Heading slot="title">Edit link</Heading>

				<TextField value={target} onChange={setTarget}>
					<Label>Link target</Label>
					<Input />
				</TextField>

				<Button
					className="react-aria-Button border-iris-300"
					autoFocus
					onPress={() => {
						updateLinkMark();
						setIsOpen(false);
					}}
				>
					Apply
				</Button>
			</Dialog>
		</Modal>
	);
}

function ClickEditors() {
	const [figureOpen, setFigureOpen] = useState(false);
	const [linkOpen, setLinkOpen] = useState(false);

	useEffect(() => {
		function onDblClick(e: MouseEvent) {
			const target = e.target;
			if (!target || !(target instanceof Node)) return;

			let curr = target instanceof Element ? target : target.parentElement;

			while (curr) {
				if (curr.tagName === 'FIGURE') {
					setFigureOpen(true);
					e.preventDefault();
					return;
				} else if (curr.tagName === 'A') {
					setLinkOpen(true);
					e.preventDefault();
					return;
				}

				curr = curr.parentElement;
			}
		}

		document.addEventListener('dblclick', onDblClick);

		return () => document.removeEventListener('dblclick', onDblClick);
	});

	return (
		<>
			<FigureDialog isOpen={figureOpen} setIsOpen={setFigureOpen} />
			<LinkDialog isOpen={linkOpen} setIsOpen={setLinkOpen} />
		</>
	);
}

export default ClickEditors;
