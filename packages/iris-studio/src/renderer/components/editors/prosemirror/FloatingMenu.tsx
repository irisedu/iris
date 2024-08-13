import { useState, useRef } from 'react';
import {
	useEditorEffect,
	useEditorEventCallback
} from '@nytimes/react-prosemirror';
import type { Node, Mark } from 'prosemirror-model';
import type { EditorView } from 'prosemirror-view';
import { Popover, TextField, Input, Button } from 'react-aria-components';

import ExternalLink from '~icons/tabler/external-link';

function setElementPos(
	elem: HTMLElement,
	view: EditorView,
	from: number,
	to: number
) {
	const start = view.coordsAtPos(from);
	const end = view.coordsAtPos(to);

	const box = elem.offsetParent?.getBoundingClientRect();
	if (!box) return;

	// https://prosemirror.net/examples/tooltip/
	const left = Math.max((start.left + end.left) / 2, start.left + 3);
	elem.style.left = left - box.left + 'px';
	elem.style.bottom = box.bottom - start.top + 'px';
}

function FloatingMenu() {
	const triggerRef = useRef<HTMLDivElement>(null);
	const [visible, setVisible] = useState(false);

	const [link, setLink] = useState<number | null>(null);
	const [linkModified, setLinkModified] = useState(false);
	const [linkHref, setLinkHref] = useState('');

	const updateLinkMark = useEditorEventCallback((view) => {
		if (!link) return;

		const state = view.state;
		const schema = state.schema;

		const node = state.doc.nodeAt(link);
		if (!node) return;

		const from = link;
		const to = link + node.nodeSize;

		view.dispatch(
			state.tr
				.removeMark(from, to, schema.marks.link)
				.addMark(from, to, schema.marks.link.create({ href: linkHref }))
		);
	});

	useEditorEffect((view) => {
		if (!triggerRef.current) return;

		const state = view.state;
		const schema = state.schema;
		const { from, to } = state.selection;

		// Links
		setLink(null);
		let linkNode: { node: Node; pos: number; mark: Mark } | undefined;
		let i = 0;

		state.doc.nodesBetween(from, to, (node, pos) => {
			if (!node.isText) return;

			if (i === 0) {
				const mark = schema.marks.link.isInSet(node.marks);
				if (mark) linkNode = { node, pos, mark };
			} else {
				linkNode = undefined;
			}

			i++;
		});

		if (linkNode) {
			const { node, pos, mark } = linkNode;

			setElementPos(triggerRef.current, view, pos, pos + node.nodeSize);
			setVisible(true);

			const modified = linkModified && link === pos;
			setLinkModified(modified);
			if (!modified) setLinkHref(mark.attrs.href);

			setLink(pos);

			return;
		}

		setVisible(false);
	});

	return (
		<>
			<div ref={triggerRef} className="absolute" />
			<Popover
				/* Force position update when focused item changes */
				key={link}
				isOpen={visible}
				className={`react-aria-Popover flex flex-row gap-1 items-center shadow-lg font-sans bg-iris-100 p-1`}
				placement="top"
				triggerRef={triggerRef}
				isNonModal
			>
				{link && (
					<>
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

						<Button
							className="round-button"
							onPress={() => {
								window.open(linkHref);
							}}
						>
							<ExternalLink className="text-iris-500 w-1/2 h-1/2 m-auto" />
						</Button>
					</>
				)}
			</Popover>
		</>
	);
}

export default FloatingMenu;
