import { type FreeResponseQuestionNode } from '@irisedu/schemas';
import {
	Button,
	Checkbox,
	GridList,
	GridListItem,
	Input,
	Label,
	Switch,
	TextArea,
	TextField,
	useDragAndDrop
} from 'iris-components';
import { ProseMirrorField, useCellEditMode } from './components';
import { arrayRemove, arrayReorder, arrayUpdate } from './arrayUtils';

import Add from '~icons/tabler/plus';
import Remove from '~icons/tabler/trash';
import Menu from '~icons/tabler/menu';

function getValue(val: string) {
	return val.length ? val : '<no value>';
}

export interface FreeResponseQuestionNodeEditorProps {
	node: FreeResponseQuestionNode;
	onUpdate: (newVal: FreeResponseQuestionNode) => void;
}

function FreeResponseQuestionNodeEditor({
	node,
	onUpdate
}: FreeResponseQuestionNodeEditorProps) {
	const { preventEvents, preventEventsProps } = useCellEditMode();
	const { dragAndDropHooks } = useDragAndDrop({
		getItems: (items) =>
			[...items].map((id) => ({
				'text/plain': getValue(node.options.find((o) => o.id === id)!.value)
			})),
		onReorder(e) {
			onUpdate({
				...node,
				options: arrayReorder(node.options, e)
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

	function updateOption(id: string, newVal: (typeof node.options)[0]) {
		onUpdate({
			...node,
			options: arrayUpdate(node.options, id, newVal)
		});
	}

	return (
		<>
			<Switch
				className="react-aria-Switch mb-2"
				isSelected={node.multiline}
				onChange={(newVal) => onUpdate({ ...node, multiline: newVal })}
			>
				Multiple line responses
			</Switch>

			<div className="my-2">
				<div className="text-sm">Options</div>
				<GridList
					className="react-aria-GridList p-2 bg-iris-50 rounded-md border-2 border-iris-200 mb-2"
					aria-label="Options"
					dragAndDropHooks={dragAndDropHooks}
				>
					{node.options.map((item) => (
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
										updateOption(item.id, {
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
										onUpdate({
											...node,
											options: arrayRemove(node.options, item.id)
										})
									}
								>
									<Remove />
								</Button>
							</div>
							<TextField
								value={item.value}
								onChange={(newVal) =>
									updateOption(item.id, {
										...item,
										value: newVal
									})
								}
							>
								<Label>Value</Label>
								{node.multiline ? (
									<TextArea {...preventEventsProps} />
								) : (
									<Input {...preventEventsProps} />
								)}
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
											updateOption(item.id, {
												...item,
												explanation: newVal
											});
										} else {
											const { explanation: _, ...rest } = item;
											updateOption(item.id, rest);
										}
									}}
									handleDOMEvents={preventEvents}
								/>
							</div>
						</GridListItem>
					))}
				</GridList>

				<Button
					onPress={() =>
						onUpdate({
							...node,
							options: [
								...node.options,
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
					value={node.catchAllExplanation ?? [{ type: 'paragraph' }]}
					onValueChanged={(newVal) => {
						if (
							newVal.length &&
							!(
								newVal.length === 1 &&
								newVal[0].type === 'paragraph' &&
								!newVal[0].content?.length
							)
						) {
							onUpdate({
								...node,
								catchAllExplanation: newVal
							});
						} else {
							const { catchAllExplanation: _, ...rest } = node;
							onUpdate(rest);
						}
					}}
				/>
			</div>

			{!node.multiline && (
				<>
					<TextField
						value={node.validator ?? ''}
						onChange={(newVal) => {
							if (newVal.length) {
								onUpdate({
									...node,
									validator: newVal
								});
							} else {
								const { validator: _, ...rest } = node;
								onUpdate(rest);
							}
						}}
					>
						<Label>Validator RegEx (optional)</Label>
						<Input className="react-aria-Input font-mono" />
					</TextField>
					<TextField
						value={node.validatorMessage ?? ''}
						onChange={(newVal) => {
							if (newVal.length) {
								onUpdate({
									...node,
									validatorMessage: newVal
								});
							} else {
								const { validatorMessage: _, ...rest } = node;
								onUpdate(rest);
							}
						}}
					>
						<Label>Validator message (optional)</Label>
						<Input />
					</TextField>
				</>
			)}
		</>
	);
}

export default FreeResponseQuestionNodeEditor;
