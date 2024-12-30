import { useRef } from 'react';
import {
	type IrisNode,
	type FillInTheBlankQuestionNode
} from '@irisedu/schemas';
import {
	ProseMirrorField,
	useCellEditMode,
	type ProseMirrorPreset
} from './components';
import { type NodeSpec, Schema } from 'prosemirror-model';
import {
	baseNodeViews,
	baseReactNodeViews,
	baseSchemaDef,
	makeBaseInputRules,
	makeBaseKeymap,
	makeBasePlugins
} from 'iris-prosemirror';
import { EditorState } from 'prosemirror-state';
import { InputRule } from 'prosemirror-inputrules';
import {
	Button,
	Checkbox,
	GridList,
	GridListItem,
	Input,
	Label,
	TextField,
	useDragAndDrop
} from 'iris-components';
import { arrayRemove, arrayReorder, arrayUpdate } from './arrayUtils';

import Add from '~icons/tabler/plus';
import Remove from '~icons/tabler/trash';
import Menu from '~icons/tabler/menu';

import './FillInTheBlankQuestionNodeEditor.css';

function getValue(val: string) {
	return val.length ? val : '<no value>';
}

function getBlankColor(id: string) {
	return '#' + id.substring(0, 8);
}

export interface FillInTheBlankQuestionNodeEditorProps {
	node: FillInTheBlankQuestionNode;
	onUpdate: (newVal: FillInTheBlankQuestionNode) => void;
}

const blankSchema = new Schema({
	nodes: {
		...baseSchemaDef.nodes,
		fill_in_blank: {
			group: 'inline',
			inline: true,
			draggable: true,
			attrs: { id: { default: '', validate: 'string' } },
			toDOM(node) {
				return [
					'span',
					{
						class: 'fill-in-blank',
						style: `border-left: 0.2rem solid ${getBlankColor(node.attrs.id)}`
					}
				];
			}
		} as NodeSpec
	},
	marks: baseSchemaDef.marks
});

const blankKeymap = makeBaseKeymap(blankSchema);
const blankRules = [
	...makeBaseInputRules(blankSchema),
	new InputRule(/____$/, (state, _match, start, end) => {
		const node = blankSchema.nodes.fill_in_blank.create({
			id: crypto.randomUUID()
		});
		return state.tr.replaceRangeWith(start, end, node);
	})
];

const blankPlugins = makeBasePlugins(blankKeymap, blankRules);

const blankNodeViews = baseNodeViews;
const blankReactNodeViews = baseReactNodeViews;

export const blankPreset: ProseMirrorPreset = {
	schema: blankSchema,
	plugins: blankPlugins,
	nodeViews: blankNodeViews,
	reactNodeViews: blankReactNodeViews,
	defaultState: EditorState.create({
		plugins: blankPlugins,
		schema: blankSchema
	})
};

function findBlankIds(nodes: IrisNode[]) {
	const blanks: string[] = [];

	for (const node of nodes) {
		if (node.type === 'fill_in_blank' && node.attrs?.id) {
			blanks.push(node.attrs.id as string);
		}

		if (node.content) blanks.push(...findBlankIds(node.content));
	}

	return blanks;
}

function getBlanks(
	node: FillInTheBlankQuestionNode,
	blankCache: Record<string, (typeof node.blanks)[0]>
) {
	const blankIds = findBlankIds(node.prompt);
	const blanks: typeof node.blanks = [];

	for (const id of blankIds) {
		const existing = node.blanks.find((b) => b.id === id);
		if (existing) {
			blanks.push(existing);
		} else if (blankCache[id]) {
			blanks.push(blankCache[id]);
		} else {
			blanks.push({
				id,
				options: []
			});
		}
	}

	// Save in case of undo
	for (const blank of node.blanks) {
		if (!blankIds.includes(blank.id)) blankCache[blank.id] = blank;
	}

	return blanks;
}

interface BlankEditorProps {
	i: number;
	blank: FillInTheBlankQuestionNode['blanks'][0];
	updateBlank: (newVal: FillInTheBlankQuestionNode['blanks'][0]) => void;
}

function BlankEditor({ i, blank, updateBlank }: BlankEditorProps) {
	function updateBlankOption(id: string, newVal: (typeof blank)['options'][0]) {
		updateBlank({
			...blank,
			options: arrayUpdate(blank.options, id, newVal)
		});
	}

	const { preventEvents, preventEventsProps } = useCellEditMode();
	const { dragAndDropHooks } = useDragAndDrop({
		getItems: (items) =>
			[...items].map((id) => ({
				'text/plain': getValue(blank.options.find((o) => o.id === id)!.value)
			})),
		onReorder(e) {
			updateBlank({
				...blank,
				options: arrayReorder(blank.options, e)
			});
		},
		renderDragPreview(items) {
			return (
				<div className="rounded-md p-2 border-2 border-iris-200 bg-iris-50">
					{items[0]['text/plain']}
				</div>
			);
		}
	});

	return (
		<div
			className="p-2"
			style={{ borderLeft: `0.2rem solid ${getBlankColor(blank.id)}` }}
		>
			<div className="text-lg font-bold">{i + 1}</div>

			<div className="my-2">
				<div className="text-sm">Options</div>
				<GridList
					className="react-aria-GridList p-2 bg-iris-50 rounded-md border-2 border-iris-200 mb-2"
					aria-label="Options"
					dragAndDropHooks={dragAndDropHooks}
				>
					{blank.options.map((item) => (
						<GridListItem
							id={item.id}
							key={item.id}
							textValue={getValue(item.value)}
						>
							<div className="flex gap-2 items-center">
								<Button slot="drag" className="text-iris-400">
									<Menu />
								</Button>
								<Checkbox
									slot={null}
									isSelected={item.correct}
									onChange={(newVal) =>
										updateBlankOption(item.id, {
											...item,
											correct: newVal
										})
									}
								>
									Correct
								</Checkbox>
								<div className="grow" />
								<Button
									className="round-button"
									aria-label="Remove"
									onPress={() =>
										updateBlank({
											...blank,
											options: arrayRemove(blank.options, item.id)
										})
									}
								>
									<Remove />
								</Button>
							</div>
							<TextField
								value={item.value}
								onChange={(newVal) =>
									updateBlankOption(item.id, {
										...item,
										value: newVal
									})
								}
							>
								<Label>Value</Label>
								<Input {...preventEventsProps} />
							</TextField>
							<div className="my-2">
								<div className="text-sm">Explanation (optional)</div>
								<ProseMirrorField
									attributes={{ class: 'p-1 border-2 border-iris-200' }}
									value={item.explanation ?? [{ type: 'paragraph' }]}
									onValueChanged={(newVal) => {
										if (
											newVal.length &&
											!(
												newVal.length === 1 &&
												newVal[0].type === 'paragraph' &&
												!newVal[0].content?.length
											)
										) {
											updateBlankOption(item.id, {
												...item,
												explanation: newVal
											});
										} else {
											const { explanation: _, ...rest } = item;
											updateBlankOption(item.id, rest);
										}
									}}
									handleDOMEvents={preventEvents}
								/>
							</div>
						</GridListItem>
					))}
				</GridList>
				<Button
					className="react-aria-Button bg-iris-200 border-iris-400"
					onPress={() =>
						updateBlank({
							...blank,
							options: [
								...blank.options,
								{
									id: crypto.randomUUID(),
									value: '',
									correct: false
								}
							]
						})
					}
				>
					<Add className="inline-block w-4 h-4 text-iris-500" /> Add new option
				</Button>
			</div>

			<div className="my-2">
				<div className="text-sm">Catch-all explanation (optional)</div>
				<ProseMirrorField
					attributes={{ class: 'p-1 border-2 border-iris-200' }}
					value={blank.catchAllExplanation ?? [{ type: 'paragraph' }]}
					onValueChanged={(newVal) => {
						if (
							newVal.length &&
							!(
								newVal.length === 1 &&
								newVal[0].type === 'paragraph' &&
								!newVal[0].content?.length
							)
						) {
							updateBlank({
								...blank,
								catchAllExplanation: newVal
							});
						} else {
							const { catchAllExplanation: _, ...rest } = blank;
							updateBlank(rest);
						}
					}}
				/>
			</div>

			<TextField
				value={blank.validator ?? ''}
				onChange={(newVal) => {
					if (newVal.length) {
						updateBlank({
							...blank,
							validator: newVal
						});
					} else {
						const { validator: _, ...rest } = blank;
						updateBlank(rest);
					}
				}}
			>
				<Label>Validator RegEx (optional)</Label>
				<Input className="react-aria-Input font-mono" />
			</TextField>
		</div>
	);
}

function FillInTheBlankQuestionNodeEditor({
	node,
	onUpdate
}: FillInTheBlankQuestionNodeEditorProps) {
	const blankCache = useRef<Record<string, (typeof node.blanks)[0]>>({});
	const blanks = getBlanks(node, blankCache.current);

	return (
		<>
			<div className="my-2">
				<div>Prompt</div>
				<p className="my-0 text-sm">
					Type <code>____</code> to insert a blank.
				</p>
				<ProseMirrorField
					attributes={{ class: 'p-1 border-2 border-iris-200' }}
					preset={blankPreset}
					value={node.prompt}
					onValueChanged={(newVal) => onUpdate({ ...node, prompt: newVal })}
				/>
			</div>
			<div className="my-2">
				<div>Blanks</div>
				<div className="flex flex-col gap-2">
					{blanks.map((blank, i) => (
						<BlankEditor
							key={blank.id}
							i={i}
							blank={blank}
							updateBlank={(newVal) =>
								onUpdate({
									...node,
									blanks: arrayUpdate(blanks, blank.id, newVal)
								})
							}
						/>
					))}
				</div>
			</div>
		</>
	);
}

export default FillInTheBlankQuestionNodeEditor;
