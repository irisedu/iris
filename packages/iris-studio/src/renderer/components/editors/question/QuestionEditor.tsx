import { useState } from 'react';
import {
	ensurePoints,
	QuestionNodeType,
	type QuestionNode
} from '@irisedu/schemas';
import {
	Button,
	Dropdown,
	Input,
	ListBoxItem,
	NumberField
} from 'iris-components';
import { arrayMoveBy, arrayRemove, arrayUpdate } from './arrayUtils';

import IrisQuestionNodeEditor from './IrisQuestionNodeEditor';
import MultipleChoiceQuestionNodeEditor from './MultipleChoiceQuestionNodeEditor';
import FillInTheBlankQuestionNodeEditor from './FillInTheBlankQuestionNodeEditor';
import FreeResponseQuestionNodeEditor from './FreeResponseQuestionNodeEditor';

import Add from '~icons/tabler/plus';
import Remove from '~icons/tabler/trash';
import Up from '~icons/tabler/chevron-up';
import Down from '~icons/tabler/chevron-down';

const typeStrings = [
	'Subquestion',
	'Iris text',
	'Multiple choice',
	'Fill in the blank',
	'Free response'
];

interface QuestionNodeEditorProps {
	baseNumber?: string;
	number: number;
	node: QuestionNode;
	onUpdate: (newVal: QuestionNode) => void;
}

function QuestionNodeEditor({
	baseNumber,
	number,
	node,
	onUpdate
}: QuestionNodeEditorProps) {
	switch (node.type) {
		case QuestionNodeType.Question:
			return (
				<QuestionEditor
					value={node.contents}
					baseNumber={(baseNumber ?? '') + number + '.'}
					onValueChanged={(update) => {
						const newVal =
							typeof update === 'function' ? update(node.contents) : update;
						onUpdate({
							...node,
							contents: newVal
						});
					}}
				/>
			);

		case QuestionNodeType.Iris:
			return <IrisQuestionNodeEditor node={node} onUpdate={onUpdate} />;

		case QuestionNodeType.MCQ:
			return (
				<MultipleChoiceQuestionNodeEditor node={node} onUpdate={onUpdate} />
			);

		case QuestionNodeType.FillInTheBlank:
			return (
				<FillInTheBlankQuestionNodeEditor node={node} onUpdate={onUpdate} />
			);

		case QuestionNodeType.FreeResponse:
			return <FreeResponseQuestionNodeEditor node={node} onUpdate={onUpdate} />;
	}
}

interface QuestionNodeProps {
	baseNumber?: string;
	number: number;
	count: number;
	node: QuestionNode;
	onMove: (ofs: number) => void;
	onDelete: () => void;
	onUpdate: (newVal: QuestionNode) => void;
}

function QuestionNodeR({
	baseNumber,
	number,
	count,
	node,
	onMove,
	onDelete,
	onUpdate
}: QuestionNodeProps) {
	const points = ensurePoints(node)?.points;

	return (
		<div>
			<div className="flex flex-row gap-2 items-center px-3 bg-iris-50 border-2 border-iris-200">
				<span className="font-bold text-lg my-2">
					<span className="text-iris-400 mr-2">
						{baseNumber}
						{number}
					</span>{' '}
					{typeStrings[node.type]}
				</span>
				<div className="grow" />
				{points !== undefined && (
					<div className="flex flex-row gap-2 items-center mx-2">
						<NumberField
							className="react-aria-NumberField max-w-[5ch] text-sm"
							aria-label="Points"
							value={points}
							onChange={(newVal) =>
								onUpdate({ ...node, points: newVal } as QuestionNode)
							}
						>
							<Input />
						</NumberField>
						pts
					</div>
				)}
				<Button
					className="round-button"
					aria-label="Move Up"
					onPress={() => onMove(-1)}
					isDisabled={number <= 1}
				>
					<Up />
				</Button>
				<Button
					className="round-button"
					aria-label="Move Down"
					onPress={() => onMove(1)}
					isDisabled={number >= count}
				>
					<Down />
				</Button>
				<Button className="round-button" aria-label="Remove" onPress={onDelete}>
					<Remove />
				</Button>
			</div>
			<div className="p-2 bg-iris-100 border-2 border-t-0 border-iris-200">
				<QuestionNodeEditor
					baseNumber={baseNumber}
					number={number}
					node={node}
					onUpdate={onUpdate}
				/>
			</div>
		</div>
	);
}

function createQuestion(type: QuestionNodeType): QuestionNode {
	const id = crypto.randomUUID();

	switch (type) {
		case QuestionNodeType.Iris:
			return { id, type, data: [{ type: 'paragraph' }] };
		case QuestionNodeType.MCQ:
			return { id, type, points: 0, options: [] };
		case QuestionNodeType.FillInTheBlank:
			return {
				id,
				type,
				points: 0,
				prompt: [{ type: 'paragraph' }],
				blanks: []
			};
		case QuestionNodeType.FreeResponse:
			return { id, type, points: 0, multiline: true, options: [] };
		case QuestionNodeType.Question:
			return { id, type, contents: [] };
	}
}

export interface QuestionEditorProps {
	baseNumber?: string;
	value: QuestionNode[];
	onValueChanged: (
		update: QuestionNode[] | ((oldVal: QuestionNode[]) => QuestionNode[])
	) => void;
}

function QuestionEditor({
	baseNumber,
	value,
	onValueChanged
}: QuestionEditorProps) {
	const [addType, setAddType] = useState<QuestionNodeType>(
		QuestionNodeType.Question
	);

	return (
		<div className="font-sans">
			<div className="flex flex-row gap-2 items-center justify-end mb-4 px-2 bg-iris-50 border-2 border-iris-200">
				<Dropdown
					aria-label="Type to Add"
					selectedKey={addType}
					onSelectionChange={(key) => setAddType(key as QuestionNodeType)}
				>
					{typeStrings.map((str, i) => (
						<ListBoxItem id={i} key={i}>
							{str}
						</ListBoxItem>
					))}
				</Dropdown>
				<Button
					className="round-button"
					aria-label="Add"
					onPress={() => {
						onValueChanged((oldVal) => [...oldVal, createQuestion(addType)]);
					}}
				>
					<Add />
				</Button>
			</div>

			<div className="flex flex-col gap-4">
				{value.map((node, i) => (
					<QuestionNodeR
						baseNumber={baseNumber}
						number={i + 1}
						count={value.length}
						key={node.id}
						node={node}
						onMove={(ofs) =>
							onValueChanged((oldVal) => arrayMoveBy(oldVal, node.id, ofs))
						}
						onDelete={() =>
							onValueChanged((oldVal) => arrayRemove(oldVal, node.id))
						}
						onUpdate={(newVal) =>
							onValueChanged((oldVal) => arrayUpdate(oldVal, node.id, newVal))
						}
					/>
				))}
			</div>
		</div>
	);
}

export default QuestionEditor;
