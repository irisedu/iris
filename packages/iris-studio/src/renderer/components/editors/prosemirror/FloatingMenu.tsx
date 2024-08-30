import { useState, useRef } from 'react';
import {
	useEditorEffect,
	useEditorEventCallback
} from '@nytimes/react-prosemirror';
import type { EditorView } from 'prosemirror-view';
import { Popover, TextField, Input, Button } from 'react-aria-components';
import { markExtend } from './commands';

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
	const [linkEnd, setLinkEnd] = useState<number | null>(null);
	const [linkModified, setLinkModified] = useState(false);
	const [linkHref, setLinkHref] = useState('');

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

		// Links
		setLink(null);

		const res = markExtend($from, $to, schema.marks.link);

		if (res) {
			const { from, to, mark } = res;

			setElementPos(triggerRef.current, view, from, to);
			setVisible(true);

			const modified = linkModified && link === from;
			setLinkModified(modified);
			if (!modified) setLinkHref(mark.attrs.href);

			setLink(from);
			setLinkEnd(to);

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
