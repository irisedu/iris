import { useCallback, useEffect, useRef, useState } from 'react';
import {
	getQuestionTextRange,
	getTextRange,
	IriscFile,
	type TextRange
} from '@irisedu/schemas';
import { Button, Popover } from 'iris-components';
import { fetchCsrf } from '../utils';

import store from '$state/store';

import Circle from '~icons/tabler/circle-filled';
import X from '~icons/tabler/x';

function SelectionMenu({ articleData }: { articleData: IriscFile }) {
	const [state, setState] = useState('default');
	const [output, setOutput] = useState('');
	const [outputDone, setOutputDone] = useState(false);

	const [selectionMenuOpen, setSelectionMenuOpen] = useState(false);
	const triggerRef = useRef<HTMLDivElement>(null);

	const [selection, setSelection] = useState(['F', 'F']);
	const [selectionSrc, setSelectionSrc] = useState('');
	const [selectionText, setSelectionText] = useState('');
	const reqId = useRef(0);

	useEffect(() => {
		function getNodeAddress(node: Node) {
			let curr: Node | null = node;
			let indexingBoundary: string | undefined;
			const indices: string[] = [];
			while (curr) {
				if (curr instanceof HTMLElement) {
					if (curr.dataset.index !== undefined)
						indices.unshift(curr.dataset.index);

					indexingBoundary = curr.dataset.indexingBoundary;
					if (indexingBoundary !== undefined) {
						break;
					}
				}

				curr = curr.parentNode;
			}

			if (indexingBoundary) {
				return { indexingBoundary, address: indices.join('.') };
			}

			return null;
		}

		function getPointAddress(node: Node, offset: number) {
			// Text should always have a span parent with index. Questions
			// contain some extra elements not satisfying this condition that
			// should not be considered for selection boundaries.
			if (
				node instanceof Text &&
				(!node.parentElement || node.parentElement.dataset.index === undefined)
			)
				return null;

			const addr = getNodeAddress(node);
			if (!addr) return null;

			if (node instanceof Text) {
				return {
					...addr,
					address: addr.address + '.' + offset
				};
			}

			return addr;
		}

		function onSelectionChange() {
			const selection = document.getSelection();
			const range = selection?.rangeCount && selection.getRangeAt(0);

			if (range && !range.collapsed) {
				const startAddr = getPointAddress(
					range.startContainer,
					range.startOffset
				);
				const endAddr = getPointAddress(range.endContainer, range.endOffset);
				if (
					!startAddr ||
					!endAddr ||
					startAddr.indexingBoundary !== endAddr.indexingBoundary
				)
					return;

				// Reset
				setSelectionMenuOpen(false);

				const src = startAddr.indexingBoundary;

				let textRange: TextRange | null = null;

				if (src.endsWith('.iq.json')) {
					const questionData = store.getState().data.questions[src];
					if (!questionData) return;

					textRange = getQuestionTextRange(
						questionData.data.data,
						startAddr.address,
						endAddr.address
					);
				} else if (src.endsWith('.irisc')) {
					textRange = getTextRange(
						articleData.data,
						startAddr.address,
						endAddr.address
					);

					if (textRange?.commonAncestor.type !== 'paragraph') {
						return;
					}
				}

				if (!textRange) return;

				setState('default');
				setSelectionMenuOpen(true);
				setSelectionSrc(src);
				setSelectionText(textRange.text);

				const selectionBox = range.getBoundingClientRect();
				const trigger = triggerRef.current;

				if (trigger) {
					const triggerBox = trigger.offsetParent?.getBoundingClientRect();
					if (!triggerBox) return;

					trigger.style.left =
						(selectionBox.left + selectionBox.right) / 2 -
						triggerBox.left +
						'px';
					trigger.style.bottom = triggerBox.bottom - selectionBox.top + 'px';

					setSelection([startAddr.address, endAddr.address]);
				}
			} else {
				if (state === 'default') setSelectionMenuOpen(false);
			}
		}

		document.addEventListener('selectionchange', onSelectionChange);
		return () =>
			document.removeEventListener('selectionchange', onSelectionChange);
	}, [articleData.data, state]);

	const makeReq = useCallback(
		(endpoint: string) => {
			const [start, end] = selection;

			const id = ++reqId.current;

			setState(endpoint);
			setOutput('');
			setOutputDone(false);

			fetchCsrf(
				`/api/llm${selectionSrc}/${endpoint}?start=${start}&end=${end}`
			).then(async (res) => {
				if (res.status !== 200) {
					setOutput('Error getting LLM output.');
					setOutputDone(true);
					return;
				}

				const reader = res.body?.getReader();
				if (!reader) return;

				const decoder = new TextDecoder();
				while (true) {
					const { value, done } = await reader.read();

					if (value) {
						// New request started
						if (reqId.current !== id) return;
						setOutput((curr) => curr + decoder.decode(value));
					}

					if (done) break;
				}

				setOutputDone(true);
			});
		},
		[selection, selectionSrc]
	);

	return (
		<>
			<div ref={triggerRef} className="absolute" />
			<Popover
				className="react-aria-Popover no-animation p-1 flex gap-1"
				key={selection[0] + selection[1]}
				isOpen={selectionMenuOpen}
				triggerRef={triggerRef}
				placement="top"
				isNonModal
				shouldCloseOnInteractOutside={() => false}
			>
				{state === 'default' ? (
					<>
						{selectionText.split(' ').length < 6 ? (
							<Button
								className="px-1 rounded-md data-[hovered]:bg-iris-200 data-[pressed]:bg-iris-300"
								onPress={() => makeReq('explain')}
							>
								Explain
							</Button>
						) : (
							<Button
								className="px-1 rounded-md data-[hovered]:bg-iris-200 data-[pressed]:bg-iris-300"
								onPress={() => makeReq('simplify')}
							>
								Simplify
							</Button>
						)}

						<Button
							className="px-1 rounded-md data-[hovered]:bg-iris-200 data-[pressed]:bg-iris-300"
							onPress={() => makeReq('hint')}
						>
							Hint
						</Button>
					</>
				) : (
					<div className="flex flex-col w-[45ch] text-sm max-w-full p-1">
						<div className="mb-2">
							<Button
								className="float-right text-iris-900"
								onPress={() => setSelectionMenuOpen(false)}
							>
								<X />
							</Button>
							<div className="font-bold">
								{state === 'explain' && (
									<>
										Explain <em>{selectionText}</em>
									</>
								)}
								{state === 'simplify' && 'Simplify'}
								{state === 'hint' && 'Hint'}
							</div>
						</div>

						<div className="mb-2 overflow-y-auto max-h-36 shrink">
							{output.length > 0 ? (
								<>
									{output}
									{outputDone ? (
										''
									) : (
										<Circle className="inline-block h-3 w-3 m-1" />
									)}
								</>
							) : (
								<span>Loading…</span>
							)}
						</div>

						<div className="text-iris-900 text-xs">
							This output was generated by a large language model. LLMs may
							produce errors.
						</div>
					</div>
				)}
			</Popover>
		</>
	);
}

export default SelectionMenu;
