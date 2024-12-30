import { useState, useRef, useMemo, type RefObject } from 'react';
import {
	useEditorEffect,
	useEditorEventCallback
} from '@nytimes/react-prosemirror';
import type { EditorView } from 'prosemirror-view';
import {
	Popover,
	TextField,
	Input,
	TextArea,
	Button,
	Label
} from 'iris-components';
import { markExtend } from 'iris-prosemirror';
import { cmdOrCtrl } from '../../../utils';

import ExternalLink from '~icons/tabler/external-link';

function setElementPos(
	elem: HTMLElement,
	view: EditorView,
	from: number,
	to: number
) {
	const start = view.coordsAtPos(from);
	const end = view.coordsAtPos(to);
	let left: number | undefined;

	if (start.left === end.left) {
		// Non-text
		const elem = view.domAtPos(from).node;

		if (elem && elem instanceof HTMLElement) {
			const rect = elem.getBoundingClientRect();
			left = (rect.left + rect.right) / 2;
		}
	} else {
		// https://prosemirror.net/examples/tooltip/
		left = Math.max((start.left + end.left) / 2, start.left + 3);
	}

	if (!left) return;

	const box = elem.offsetParent?.getBoundingClientRect();
	if (!box) return;

	elem.style.left = left - box.left + 'px';
	elem.style.bottom = box.bottom - start.top + 'px';
}

function useLinkWidget(triggerRef: RefObject<HTMLDivElement>) {
	const [link, setLink] = useState<number | null>(null);
	const [linkEnd, setLinkEnd] = useState<number | null>(null);
	const [linkModified, setLinkModified] = useState(false);
	const [linkHref, setLinkHref] = useState('');
	const isExternalLink = useMemo(() => {
		try {
			new URL(linkHref);
			return true;
		} catch {
			return false;
		}
	}, [linkHref]);

	const updateLinkMark = useEditorEventCallback((view) => {
		if (!link || !linkEnd) return;

		const state = view.state;
		const schema = state.schema;

		const node = state.doc.nodeAt(link);
		if (!node) return;

		view.dispatch(
			state.tr
				.removeMark(link, linkEnd, schema.marks.link)
				.addMark(link, linkEnd, schema.marks.link.create({ href: linkHref }))
		);
	});

	useEditorEffect((view) => {
		if (!triggerRef.current) return;

		const state = view.state;
		const schema = state.schema;
		const { $from, $to } = state.selection;

		setLink(null);

		const res = markExtend($from, $to, schema.marks.link);

		if (res) {
			const { from, to, mark } = res;

			setElementPos(triggerRef.current, view, from, to);

			const modified = linkModified && link === from;
			setLinkModified(modified);
			if (!modified) setLinkHref(mark.attrs.href);

			setLink(from);
			setLinkEnd(to);
		}
	});

	const component = link && (
		<div className="flex flex-row gap-1 items-center">
			<TextField
				className="react-aria-TextField m-0 w-36"
				aria-label="Link"
				value={linkHref}
				onChange={(value) => {
					setLinkHref(value);
					setLinkModified(true);
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						updateLinkMark();
						setLinkModified(false);
					}
				}}
			>
				<Input placeholder="Link" />
			</TextField>

			<Button
				className="react-aria-Button border-iris-300"
				isDisabled={!linkModified}
				onPress={() => {
					updateLinkMark();
					setLinkModified(false);
				}}
			>
				Save
			</Button>

			{isExternalLink && (
				<Button
					className="round-button"
					onPress={() => {
						window.open(linkHref);
					}}
				>
					<ExternalLink />
				</Button>
			)}
		</div>
	);

	return { link, component };
}

function useImageWidget(triggerRef: RefObject<HTMLDivElement>) {
	const [image, setImage] = useState<number | null>(null);
	const [imageModified, setImageModified] = useState(false);

	const [imageSrc, setImageSrc] = useState('');
	const [imageAlt, setImageAlt] = useState('');

	const updateImage = useEditorEventCallback((view) => {
		if (!image) return;

		const state = view.state;

		view.dispatch(
			state.tr
				.setNodeAttribute(image, 'src', imageSrc)
				.setNodeAttribute(image, 'alt', imageAlt)
		);
	});

	useEditorEffect((view) => {
		if (!triggerRef.current) return;

		const state = view.state;
		const schema = state.schema;
		const { $head } = state.selection;

		setImage(null);

		const pos = $head.start($head.depth);
		const node = state.doc.nodeAt(pos);

		if (node?.type !== schema.nodes.image) return;

		setElementPos(triggerRef.current, view, pos, pos);

		const modified = imageModified && image === pos;
		setImageModified(modified);
		if (!modified) {
			setImageSrc(node.attrs.src ?? '');
			setImageAlt(node.attrs.alt ?? '');
		}

		setImage(pos);
	});

	const component = image && (
		<div className="flex flex-col gap-1 w-56">
			<TextField
				className="react-aria-TextField m-0"
				value={imageSrc}
				onChange={(value) => {
					setImageSrc(value);
					setImageModified(true);
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter') {
						updateImage();
						setImageModified(false);
					}
				}}
			>
				<Label>Source</Label>
				<Input />
			</TextField>

			<TextField
				className="react-aria-TextField m-0"
				value={imageAlt}
				onChange={(value) => {
					setImageAlt(value);
					setImageModified(true);
				}}
				onKeyDown={(e) => {
					if (e.key === 'Enter' && cmdOrCtrl(e)) {
						updateImage();
						setImageModified(false);
					}
				}}
			>
				<Label>Alt text</Label>
				<TextArea />
			</TextField>

			<Button
				className="react-aria-Button border-iris-300"
				isDisabled={!imageModified}
				onPress={() => {
					updateImage();
					setImageModified(false);
				}}
			>
				Save
			</Button>
		</div>
	);

	return { image, component };
}

function FloatingMenu() {
	const triggerRef = useRef<HTMLDivElement>(null);

	const { link, component: linkComponent } = useLinkWidget(triggerRef);
	const { image, component: imageComponent } = useImageWidget(triggerRef);

	return (
		<>
			<div ref={triggerRef} className="absolute" />
			<Popover
				/* Force position update when focused item changes */
				key={link ?? image ?? 'none'}
				isOpen={!!(link || image)}
				className={`react-aria-Popover flex flex-col gap-1 shadow-lg font-sans bg-iris-100 p-1`}
				placement="top"
				triggerRef={triggerRef}
				isNonModal
			>
				{linkComponent}
				{imageComponent}
			</Popover>
		</>
	);
}

export default FloatingMenu;
