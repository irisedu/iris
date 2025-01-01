import {
	nodesToString,
	type MultipleChoiceQuestionNode
} from '@irisedu/schemas';
import {
	Button,
	Checkbox,
	GridList,
	GridListItem,
	Switch,
	useDragAndDrop
} from 'iris-components';

import Add from '~icons/tabler/plus';
import Remove from '~icons/tabler/trash';
import Menu from '~icons/tabler/menu';
import { ProseMirrorField, useCellEditMode } from './components';
import { arrayRemove, arrayReorder, arrayUpdate } from './arrayUtils';

export interface MultipleChoiceQuestionNodeEditorProps {
	node: MultipleChoiceQuestionNode;
	onUpdate: (newVal: MultipleChoiceQuestionNode) => void;
}

function MultipleChoiceQuestionNodeEditor({
	node,
	onUpdate
}: MultipleChoiceQuestionNodeEditorProps) {
	function getLabel(opt: (typeof node.options)[0]) {
		const str = nodesToString(opt.label);
		return str.length ? str : '<no label>';
	}

	function updateOption(id: string, newVal: (typeof node.options)[0]) {
		onUpdate({
			...node,
			options: arrayUpdate(node.options, id, newVal)
		});
	}

	const { preventEvents } = useCellEditMode();
	const { dragAndDropHooks } = useDragAndDrop({
		getItems: (items) =>
			[...items].map((id) => ({
				'text/plain': getLabel(node.options.find((o) => o.id === id)!)
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

	return (
		<>
			<Switch
				className="react-aria-Switch mb-2"
				isSelected={node.multipleResponse ?? false}
				onChange={(newVal) => {
					if (newVal) {
						onUpdate({ ...node, multipleResponse: true });
					} else {
						const { multipleResponse: _, ...rest } = node;
						onUpdate(rest);
					}
				}}
			>
				Allow multiple responses
			</Switch>

			<GridList
				className="react-aria-GridList p-2 bg-iris-50 rounded-md border-2 border-iris-200 mb-2"
				aria-label="Options"
				dragAndDropHooks={dragAndDropHooks}
			>
				{node.options.map((item) => (
					<GridListItem id={item.id} key={item.id} textValue={getLabel(item)}>
						<div className="flex gap-2 items-center">
							<Button slot="drag" className="text-iris-400">
								<Menu />
							</Button>
							<Checkbox
								slot={null}
								isSelected={item.correct}
								onChange={(newVal) =>
									updateOption(item.id, { ...item, correct: newVal })
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
						<div className="my-2">
							<div>Option label</div>
							<ProseMirrorField
								attributes={{ class: 'p-1 border-2 border-iris-200' }}
								value={item.label}
								onValueChanged={(newVal) =>
									updateOption(item.id, { ...item, label: newVal })
								}
								handleDOMEvents={preventEvents}
							/>
						</div>
						<div className="my-2">
							<div>Explanation (optional)</div>
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
										updateOption(item.id, { ...item, explanation: newVal });
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
								label: [{ type: 'paragraph' }],
								correct: false
							}
						]
					})
				}
			>
				<Add className="inline-block w-4 h-4 text-iris-500" /> Add new option
			</Button>
		</>
	);
}

export default MultipleChoiceQuestionNodeEditor;
